import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/payment/razorpay';
import { getCurrentUser } from '@/lib/auth/session';
import { confirmRazorpayOrder } from '@/lib/payment/confirmOrder';
import { getPendingOrder } from '@/lib/payment/pendingOrders';
import type { OrderPayload } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getCurrentUser(req);
    const body = await req.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData: directOrderData,
    }: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      orderData?: OrderPayload;
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing Razorpay payment verification parameters.' },
        { status: 400 }
      );
    }

    // 1. Verify cryptographic HMAC-SHA256 signature
    const isValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      console.error(`[Razorpay] Invalid signature for order ${razorpay_order_id}, payment ${razorpay_payment_id}`);
      return NextResponse.json(
        { error: 'Payment signature verification failed. Potential tampering detected.' },
        { status: 400 }
      );
    }

    // Authoritative Server Order Data: Always prioritize server-verified pending order over client payload
    const orderData = getPendingOrder(razorpay_order_id) || directOrderData;

    if (!orderData || !orderData.line_items || orderData.line_items.length === 0) {
      return NextResponse.json(
        { error: 'Missing order details for confirmation.' },
        { status: 400 }
      );
    }

    if (sessionUser?.id && Number(sessionUser.id) > 0) {
      orderData.customer_id = Number(sessionUser.id);
    }

    // 2. Idempotent Order Confirmation (Prevents duplicates if Webhook arrived first)
    const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
    const requestOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : req.nextUrl.origin;

    const result = await confirmRazorpayOrder({
      razorpay_order_id,
      razorpay_payment_id,
      orderData,
      source: 'browser_verify',
      originUrl: requestOrigin,
    });

    return NextResponse.json({
      success: true,
      order: result.order,
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification failed.' },
      { status: 500 }
    );
  }
}
