import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrder } from '@/lib/payment/razorpay';
import { getCurrentUser } from '@/lib/auth/session';
import { setPendingOrder } from '@/lib/payment/pendingOrders';
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

    const order = await createRazorpayOrder({
      amountInRupees: numAmount,
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
