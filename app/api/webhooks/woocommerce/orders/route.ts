import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { sendOrderConfirmationSms } from '@/lib/sms/httpsms';
import type { WooOrder } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * WooCommerce Webhook Endpoint
 * Listens for `order.created` events dispatched from WordPress / WooCommerce.
 * This ensures SMS is dispatched even if the order was created from WP Admin, POS, or external channels.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-wc-webhook-signature');
    const topic = req.headers.get('x-wc-webhook-topic') || 'order.created';
    const webhookSecret = process.env.WC_WEBHOOK_SECRET;

    // Verify HMAC-SHA256 signature if secret is configured
    if (webhookSecret && signature) {
      const computedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody, 'utf8')
        .digest('base64');

      if (computedSignature !== signature) {
        console.warn('[WooCommerce Webhook] Invalid webhook signature detected.');
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    if (!rawBody) {
      return NextResponse.json({ error: 'Empty webhook payload' }, { status: 400 });
    }

    let orderData: WooOrder;
    try {
      orderData = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Check if this is an order payload
    if (!orderData || !orderData.id) {
      return NextResponse.json({ message: 'Payload received, but no valid order ID found' }, { status: 200 });
    }

    console.log(`[WooCommerce Webhook] Received webhook for Order #${orderData.id} (Topic: ${topic})`);

    // Dispatch SMS asynchronously
    const smsResult = await sendOrderConfirmationSms(orderData);

    return NextResponse.json({
      success: true,
      orderId: orderData.id,
      topic,
      sms: smsResult,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhook handling failed';
    console.error('[WooCommerce Webhook] Error processing order webhook:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
