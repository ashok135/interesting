import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpaySignature } from '@/lib/payment/razorpay';
import { getCurrentUser } from '@/lib/auth/session';
import { wcFetch, clearWcCache } from '@/lib/api/client';
import { updateCustomer } from '@/lib/api/customers';
import { sendOrderConfirmationSms } from '@/lib/sms/httpsms';
import type { OrderPayload, WooOrder } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getCurrentUser(req);
    const body = await req.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    }: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      orderData: OrderPayload;
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

    if (!orderData || !orderData.line_items || orderData.line_items.length === 0) {
      return NextResponse.json(
        { error: 'Missing order details for confirmation.' },
        { status: 400 }
      );
    }

    // 2. Determine customer ID
    let customerId: number | undefined = undefined;
    if (sessionUser?.id && Number(sessionUser.id) > 0) {
      customerId = Number(sessionUser.id);
    } else if (orderData.customer_id && Number(orderData.customer_id) > 0) {
      customerId = Number(orderData.customer_id);
    }

    const billingAddress = {
      first_name: orderData.billing.first_name || sessionUser?.name?.split(' ')[0] || 'Customer',
      last_name: orderData.billing.last_name || sessionUser?.name?.split(' ').slice(1).join(' ') || '',
      company: '',
      email: orderData.billing.email || sessionUser?.email || 'guest@interestingstore.com',
      phone: orderData.billing.phone || '',
      address_1: orderData.billing.address_1.trim(),
      address_2: (orderData.billing.address_2 || '').trim(),
      city: orderData.billing.city.trim(),
      state: orderData.billing.state.trim(),
      postcode: orderData.billing.postcode.trim(),
      country: orderData.billing.country || 'IN',
    };

    const shippingAddress = orderData.shipping ? {
      first_name: orderData.shipping.first_name || billingAddress.first_name,
      last_name: orderData.shipping.last_name || billingAddress.last_name,
      company: '',
      address_1: orderData.shipping.address_1.trim(),
      address_2: (orderData.shipping.address_2 || '').trim(),
      city: orderData.shipping.city.trim(),
      state: orderData.shipping.state.trim(),
      postcode: orderData.shipping.postcode.trim(),
      country: orderData.shipping.country || 'IN',
    } : { ...billingAddress };

    // 3. Prepare WooCommerce Order Payload with paid status
    const wcPayload: Record<string, unknown> = {
      payment_method: 'razorpay',
      payment_method_title: 'Razorpay Online (UPI / Cards / Netbanking)',
      set_paid: true,
      status: 'processing', // Paid & confirmed
      transaction_id: razorpay_payment_id,
      billing: billingAddress,
      shipping: shippingAddress,
      line_items: orderData.line_items.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity) || 1,
      })),
      meta_data: [
        { key: 'razorpay_order_id', value: razorpay_order_id },
        { key: 'razorpay_payment_id', value: razorpay_payment_id },
        { key: 'payment_verified_at', value: new Date().toISOString() },
      ],
    };

    if (customerId) {
      wcPayload.customer_id = customerId;
    }

    if (orderData.coupon_code) {
      wcPayload.coupon_lines = [{ code: orderData.coupon_code.trim().toLowerCase() }];
    }

    if (orderData.shipping_lines && orderData.shipping_lines.length > 0) {
      wcPayload.shipping_lines = orderData.shipping_lines;
    }

    if (orderData.customer_note) {
      wcPayload.customer_note = orderData.customer_note;
    }

    // 4. Create confirmed Order in WooCommerce
    const order = await wcFetch<WooOrder>('orders', {
      method: 'POST',
      body: wcPayload,
    });

    clearWcCache();

    if (customerId) {
      try {
        await updateCustomer(customerId, {
          billing: billingAddress,
          shipping: shippingAddress,
        });
      } catch (custErr) {
        console.warn('Failed to auto-save address to customer profile:', custErr);
      }
    }

    // 5. Send Order Confirmation SMS
    try {
      const smsResult = await sendOrderConfirmationSms(order);
      console.log(`[httpSMS] Razorpay Order #${order.id} SMS sent:`, JSON.stringify(smsResult));
    } catch (smsErr) {
      console.error('[httpSMS] Error sending order SMS:', smsErr);
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification failed.' },
      { status: 500 }
    );
  }
}
