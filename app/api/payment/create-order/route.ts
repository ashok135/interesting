import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrder } from '@/lib/payment/razorpay';
import { getCurrentUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getCurrentUser(req);
    const body = await req.json();
    const { amount, receipt, notes } = body;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid order amount.' },
        { status: 400 }
      );
    }

    const orderNotes = {
      ...(notes || {}),
      customer_email: sessionUser?.email || notes?.customer_email || 'guest@interestingstore.com',
      created_at: new Date().toISOString(),
    };

    const order = await createRazorpayOrder({
      amountInRupees: numAmount,
      receipt: receipt || `ord_${Date.now()}`,
      notes: orderNotes,
    });

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
