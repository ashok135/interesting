import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/payment/razorpay';
import { getCurrentUser, createOrderAccessToken } from '@/lib/auth/session';
import { confirmRazorpayOrder } from '@/lib/payment/confirmOrder';
import { getPendingOrder } from '@/lib/payment/pendingOrders';
import { checkRateLimit } from '@/lib/security/rateLimit';
import type { OrderPayload } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const rl = checkRateLimit(req, { limit: 20, windowMs: 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSec) } }
      );
    }

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

    // Security: Always derive customer_id strictly from authenticated session cookie
    const verifiedOrderData: OrderPayload = {
      ...orderData,
      customer_id: sessionUser?.id && Number(sessionUser.id) > 0 ? Number(sessionUser.id) : undefined,
    };

    // 2. Idempotent Order Confirmation (Prevents duplicates if Webhook arrived first)
    const result = await confirmRazorpayOrder({
      razorpay_order_id,
      razorpay_payment_id,
      orderData: verifiedOrderData,
      source: 'browser_verify',
    });

    const invoiceToken = createOrderAccessToken(result.order.id, result.order.billing?.email);

    return NextResponse.json({
      success: true,
      order: result.order,
      alreadyProcessed: result.alreadyProcessed,
      invoiceToken,
    });
  } catch (error: unknown) {
    console.error('Payment verification error:', error);
    const message = error instanceof Error ? error.message : 'Payment verification failed.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
