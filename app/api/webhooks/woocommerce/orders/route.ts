import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendOrderConfirmationSms, sendOrderStatusUpdateSms } from '@/lib/sms/httpsms';
import type { WooOrder } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * Health check / verification
 * GET https://interesting-ten.vercel.app/api/webhooks/woocommerce/orders
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhooks/woocommerce/orders',
    message: 'WooCommerce Order Webhook endpoint is healthy and ready to receive events.',
    supportedTopics: ['order.created', 'order.updated', 'action.woocommerce_webhook_ping'],
  });
}

/**
 * WooCommerce Webhook Listener
 * POST https://interesting-ten.vercel.app/api/webhooks/woocommerce/orders
 *
 * Supports:
 * - Ping verification (action.woocommerce_webhook_ping)
 * - Order Created (order.created)
 * - Order Updated (order.updated) -> Triggers delivery/status SMS when marked "completed", "shipped", etc.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-wc-webhook-signature');
    const topic = req.headers.get('x-wc-webhook-topic') || '';
    const webhookSecret = process.env.WC_WEBHOOK_SECRET;

    // 1. Handle WooCommerce Ping (Sent when creating/testing the webhook in WP Admin)
    if (topic.includes('ping') || rawBody.includes('webhook_id')) {
      console.log('[WooCommerce Webhook] Ping verification received successfully.');
      return NextResponse.json({
        success: true,
        message: 'WooCommerce webhook ping verified.',
      });
    }

    // 2. Verify HMAC-SHA256 signature if a secret is configured in env
    if (webhookSecret) {
      if (!signature) {
        console.warn('[WooCommerce Webhook] Missing x-wc-webhook-signature header.');
        return NextResponse.json({ error: 'Missing webhook signature header' }, { status: 401 });
      }

      const computedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody, 'utf8')
        .digest('base64');

      const computedBuf = Buffer.from(computedSignature, 'utf8');
      const sigBuf = Buffer.from(signature, 'utf8');

      if (computedBuf.length !== sigBuf.length || !crypto.timingSafeEqual(computedBuf, sigBuf)) {
        console.warn('[WooCommerce Webhook] Invalid signature detected.');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    if (!rawBody || rawBody.trim() === '') {
      return NextResponse.json({ message: 'Empty body' }, { status: 200 });
    }

    let orderData: WooOrder;
    try {
      orderData = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    if (!orderData || !orderData.id) {
      return NextResponse.json({ message: 'Payload received, but no valid order ID found' }, { status: 200 });
    }

    const orderId = orderData.id;
    const orderStatus = (orderData.status || '').toLowerCase().trim();

    console.log(`[WooCommerce Webhook] Order #${orderId} event received. Topic: "${topic}", Status: "${orderStatus}"`);

    // 3. Skip sending SMS for intermediate or pending states ('pending', 'pending payment', 'on-hold', 'checkout-draft', 'failed')
    const SILENT_STATUSES = ['pending', 'pending payment', 'pending-payment', 'on-hold', 'checkout-draft', 'auto-draft', 'failed'];
    if (SILENT_STATUSES.includes(orderStatus) || orderStatus.includes('pending')) {
      console.log(`[WooCommerce Webhook] Order #${orderId} status is "${orderStatus}". Skipping customer SMS.`);
      return NextResponse.json({
        success: true,
        orderId,
        status: orderStatus,
        topic,
        message: `Status "${orderStatus}" does not trigger customer SMS notification.`,
      });
    }

    let smsResult;

    if (topic === 'order.created') {
      // Order created in WooCommerce
      smsResult = await sendOrderConfirmationSms(orderData);
    } else {
      // order.updated: triggers when status moves to completed, shipped, processing, cancelled, refunded
      smsResult = await sendOrderStatusUpdateSms(orderData, orderStatus);
    }

    return NextResponse.json({
      success: true,
      orderId,
      status: orderStatus,
      topic,
      sms: smsResult,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook handling failed';
    console.error('[WooCommerce Webhook] Error processing webhook:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
