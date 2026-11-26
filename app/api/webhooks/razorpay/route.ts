import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/payment/razorpay';
import { getPendingOrder } from '@/lib/payment/pendingOrders';
import { confirmRazorpayOrder } from '@/lib/payment/confirmOrder';
import type { OrderPayload } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * Health check & status verification
 * GET /api/webhooks/razorpay
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhooks/razorpay',
    message: 'Razorpay Payment Webhook endpoint is healthy and ready to receive events.',
    supportedEvents: ['payment.captured', 'order.paid', 'payment.failed'],
  });
}

/**
 * Razorpay Webhook Receiver
 * POST /api/webhooks/razorpay
 *
 * This webhook acts as the safety net:
 * If the customer closes their browser or loses internet right after paying on UPI/Cards,
 * Razorpay notifies this endpoint directly, ensuring WooCommerce orders and SMS are never lost.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!rawBody) {
      return NextResponse.json({ error: 'Empty body' }, { status: 400 });
    }

    // Razorpay Webhook Secret (Falls back to Key Secret if dedicated webhook secret is not set)
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET ||
      process.env.RAZORPAY_KEY_SECRET ||
      '';

    if (!webhookSecret) {
      console.error('[Razorpay Webhook] Razorpay webhook secret is not configured.');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    if (!signature) {
      console.warn('[Razorpay Webhook] Missing x-razorpay-signature header.');
      return NextResponse.json(
        { error: 'Missing x-razorpay-signature header' },
        { status: 401 }
      );
    }

    const isValid = verifyRazorpayWebhookSignature({
      rawBody,
      signature,
      secret: webhookSecret,
    });

    if (!isValid) {
      console.error('[Razorpay Webhook] Invalid signature detected. Request rejected.');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    let eventData: any;
    try {
      eventData = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const event = eventData.event;
    console.log(`[Razorpay Webhook] Event received: "${event}"`);

    // Handle Payment Captured or Order Paid
    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = eventData.payload?.payment?.entity;
      if (!payment) {
        console.warn('[Razorpay Webhook] Missing payment entity in payload.');
        return NextResponse.json({ message: 'No payment entity found' }, { status: 200 });
      }

      const paymentId = payment.id;
      const orderId = payment.order_id;
      const amountInRupees = (payment.amount || 0) / 100;
      const notes = payment.notes || {};

      console.log(`[Razorpay Webhook] Processing successful payment ${paymentId} for Order ${orderId} (₹${amountInRupees})`);

      // 1. Try to get complete cached order details from create-order
      let orderData: OrderPayload | null = getPendingOrder(orderId);

      // 2. If server restarted and in-memory cache was lost, reconstruct from Razorpay notes
      if (!orderData) {
        console.log(`[Razorpay Webhook] Order #${orderId} not in cache, reconstructing from payment notes...`);
        const customerName = notes.customer_name || 'Valued Customer';
        const nameParts = customerName.split(' ');
        const firstName = nameParts[0] || 'Customer';
        const lastName = nameParts.slice(1).join(' ') || '';

        let parsedLineItems: { product_id: number; quantity: number }[] = [];
        if (notes.items_compact) {
          try {
            parsedLineItems = notes.items_compact.split(',').map((pair: string) => {
              const [pid, qty] = pair.split(':');
              return {
                product_id: Number(pid),
                quantity: Number(qty) || 1,
              };
            }).filter((item: any) => !isNaN(item.product_id) && item.product_id > 0);
          } catch (e) {
            console.warn('[Razorpay Webhook] Failed to parse items_compact from notes:', e);
          }
        }

        if (parsedLineItems.length === 0) {
          parsedLineItems = [
            {
              product_id: Number(notes.primary_product_id) || 124,
              quantity: Number(notes.items_count) || 1,
            },
          ];
        }

        orderData = {
          billing: {
            first_name: firstName,
            last_name: lastName,
            email: payment.email || notes.customer_email || 'guest@intersting.duckdns.org',
            phone: payment.contact || notes.customer_phone || '',
            address_1: notes.address_1 || 'Express Delivery Address',
            address_2: notes.address_2 || '',
            city: notes.city || 'Chennai',
            state: notes.state || 'Tamil Nadu',
            postcode: notes.pincode || '600001',
            country: 'IN',
          },
          shipping: {
            first_name: firstName,
            last_name: lastName,
            email: payment.email || notes.customer_email || 'guest@intersting.duckdns.org',
            phone: payment.contact || notes.customer_phone || '',
            address_1: notes.address_1 || 'Express Delivery Address',
            address_2: notes.address_2 || '',
            city: notes.city || 'Chennai',
            state: notes.state || 'Tamil Nadu',
            postcode: notes.pincode || '600001',
            country: 'IN',
          },
          line_items: parsedLineItems,
          coupon_code: notes.coupon_code || undefined,
        };
      }

      // 3. Confirm order in WooCommerce idempotently (Won't duplicate if browser already confirmed)
      if (!orderData) {
        return NextResponse.json({ error: 'Unable to resolve order payload' }, { status: 400 });
      }

      const result = await confirmRazorpayOrder({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        orderData,
        source: 'webhook',
      });

      return NextResponse.json({
        success: true,
        orderId: result.order.id,
        alreadyProcessed: result.alreadyProcessed,
        message: result.alreadyProcessed
          ? 'Order was already confirmed by browser callback.'
          : 'Order successfully created and confirmed via Razorpay webhook.',
      });
    }

    if (event === 'payment.failed') {
      const payment = eventData.payload?.payment?.entity;
      console.warn(`[Razorpay Webhook] Payment failed: ${payment?.id} (${payment?.error_description || 'Unknown error'})`);
      return NextResponse.json({ received: true, status: 'payment_failed_acknowledged' });
    }

    return NextResponse.json({ received: true, event });
  } catch (error: any) {
    console.error('[Razorpay Webhook] Internal error handling webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed.' },
      { status: 500 }
    );
  }
}
