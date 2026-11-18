import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrder } from '@/lib/payment/razorpay';
import { getCurrentUser } from '@/lib/auth/session';
import { setPendingOrder } from '@/lib/payment/pendingOrders';
import { getProducts } from '@/lib/api/products';
import type { OrderPayload } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getCurrentUser(req);
    const body = await req.json();
    const { amount, receipt, notes, orderData }: { amount: number; receipt?: string; notes?: Record<string, string>; orderData?: OrderPayload } = body;

    const numAmount = parseFloat(String(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid order amount.' },
        { status: 400 }
      );
    }

    const orderNotes: Record<string, string> = {
      ...(notes || {}),
      customer_email: sessionUser?.email || notes?.customer_email || 'guest@interestingstore.com',
      created_at: new Date().toISOString(),
    };

    if (orderData?.billing) {
      orderNotes.customer_name = `${orderData.billing.first_name || ''} ${orderData.billing.last_name || ''}`.trim() || 'Customer';
      if (orderData.billing.phone) orderNotes.customer_phone = orderData.billing.phone;
      if (orderData.billing.city) orderNotes.city = orderData.billing.city;
      if (orderData.billing.postcode) orderNotes.pincode = orderData.billing.postcode;
    }

    let finalChargeAmount = numAmount;

    // Server-Side Price Verification: Fetch live product prices from WooCommerce
    if (orderData?.line_items && orderData.line_items.length > 0) {
      try {
        const productIds = orderData.line_items.map((i) => Number(i.product_id)).filter((id) => !isNaN(id) && id > 0);
        const products = await getProducts({ include: productIds, perPage: 50 });
        const productMap = new Map<number, number>();
        products.forEach((p) => {
          const pPrice = parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 0;
          productMap.set(p.id, pPrice);
        });

        let serverSubtotal = 0;
        for (const item of orderData.line_items) {
          const itemPrice = productMap.get(Number(item.product_id));
          if (itemPrice !== undefined) {
            serverSubtotal += itemPrice * (Number(item.quantity) || 1);
          }
        }

        if (serverSubtotal > 0) {
          const shippingFee = serverSubtotal >= 499 ? 0 : 50;
          const calculatedTotal = serverSubtotal + shippingFee;
          // Block price tampering: if client amount is suspiciously low (less than half of subtotal), enforce server total
          if (numAmount < serverSubtotal * 0.5) {
            console.warn(`[Security Alert] Price tampering detected! Client sent ₹${numAmount}, server enforced ₹${calculatedTotal}`);
            finalChargeAmount = calculatedTotal;
          }
        }
      } catch (priceErr) {
        console.warn('Could not re-calculate server price:', priceErr);
      }
    }

    const order = await createRazorpayOrder({
      amountInRupees: finalChargeAmount,
      receipt: receipt || `ord_${Date.now()}`,
      notes: orderNotes,
    });

    // Store pending order details in memory cache for both browser callback and webhook
    if (orderData) {
      setPendingOrder(order.id, orderData);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment gateway order.' },
      { status: 500 }
    );
  }
}
