import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrder } from '@/lib/payment/razorpay';
import { getCurrentUser } from '@/lib/auth/session';
import { setPendingOrder } from '@/lib/payment/pendingOrders';
import { verifyAndCalculateOrderPricing } from '@/lib/payment/pricing';
import { checkRateLimit } from '@/lib/security/rateLimit';
import type { OrderPayload } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting: 15 checkout attempts per minute per IP
    const rl = checkRateLimit(req, { limit: 15, windowMs: 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many payment requests. Please wait a moment before trying again.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSec) } }
      );
    }

    const sessionUser = await getCurrentUser(req);
    const body = await req.json();
    const {
      notes,
      orderData,
    }: {
      amount?: number;
      receipt?: string;
      notes?: Record<string, string>;
      orderData?: OrderPayload;
    } = body;

    if (!orderData?.line_items || orderData.line_items.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required to initialize payment.' },
        { status: 400 }
      );
    }

    // 2. Authoritative Server-Side Price, Stock & Coupon Verification
    const pricing = await verifyAndCalculateOrderPricing(orderData.line_items, orderData.coupon_code);
    const finalChargeAmount = pricing.grandTotal;

    if (finalChargeAmount <= 0) {
      return NextResponse.json(
        { error: 'Order total must be greater than zero for online payment.' },
        { status: 400 }
      );
    }

    // Security: Always bind customer_id strictly to authenticated session user (never trust client body)
    const sanitizedOrderData: OrderPayload = {
      ...orderData,
      customer_id: sessionUser?.id && Number(sessionUser.id) > 0 ? Number(sessionUser.id) : undefined,
      line_items: pricing.normalizedLineItems,
      coupon_code: pricing.appliedCouponCode,
    };

    const orderNotes: Record<string, string> = {
      ...(notes || {}),
      customer_email: sessionUser?.email || orderData.billing?.email || notes?.customer_email || 'guest@intersting.duckdns.org',
      created_at: new Date().toISOString(),
      items_compact: pricing.normalizedLineItems.map((i) => `${i.product_id}:${i.quantity}`).join(','),
    };

    if (pricing.appliedCouponCode) {
      orderNotes.coupon_code = pricing.appliedCouponCode;
    }

    if (orderData.billing) {
      orderNotes.customer_name = `${orderData.billing.first_name || ''} ${orderData.billing.last_name || ''}`.trim() || 'Customer';
      if (orderData.billing.phone) orderNotes.customer_phone = orderData.billing.phone;
      if (orderData.billing.city) orderNotes.city = orderData.billing.city;
      if (orderData.billing.postcode) orderNotes.pincode = orderData.billing.postcode;
      if (orderData.billing.address_1) orderNotes.address_1 = orderData.billing.address_1.slice(0, 100);
      if (orderData.billing.state) orderNotes.state = orderData.billing.state.slice(0, 50);
    }

    const order = await createRazorpayOrder({
      amountInRupees: finalChargeAmount,
      receipt: body.receipt || `ord_${Date.now()}`,
      notes: orderNotes,
    });

    setPendingOrder(order.id, sanitizedOrderData);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: unknown) {
    console.error('Error creating Razorpay order:', error);
    const message = error instanceof Error ? error.message : 'Failed to initialize payment gateway order.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
