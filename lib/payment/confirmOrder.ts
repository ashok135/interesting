import { wcFetch, clearWcCache } from '@/lib/api/client';
import { updateCustomer } from '@/lib/api/customers';
import { sendOrderConfirmationSms } from '@/lib/sms/httpsms';
import { getRazorpay } from '@/lib/payment/razorpay';
import { verifyAndCalculateOrderPricing } from '@/lib/payment/pricing';
import { deletePendingOrder } from './pendingOrders';
import type { OrderPayload, WooOrder } from '@/types';

export interface ConfirmOrderParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  orderData: OrderPayload;
  source?: 'browser_verify' | 'webhook';
}

export interface ConfirmOrderResult {
  alreadyProcessed: boolean;
  order: WooOrder;
}

export async function confirmRazorpayOrder({
  razorpay_order_id,
  razorpay_payment_id,
  orderData,
  source = 'browser_verify',
}: ConfirmOrderParams): Promise<ConfirmOrderResult> {
  // 1. Check idempotency: Has an order with this transaction_id already been created?
  try {
    const existing = await wcFetch<WooOrder[]>('orders', {
      params: {
        search: razorpay_payment_id,
        per_page: 5,
      },
    });

    if (Array.isArray(existing) && existing.length > 0) {
      const match = existing.find(
        (o) =>
          o.transaction_id === razorpay_payment_id ||
          o.meta_data?.some((m) => m.key === 'razorpay_payment_id' && m.value === razorpay_payment_id)
      );

      if (match) {
        deletePendingOrder(razorpay_order_id);
        return {
          alreadyProcessed: true,
          order: match,
        };
      }
    }
  } catch (searchErr) {
    console.warn(`[Order Confirmation (${source})] Error searching for existing order:`, searchErr);
  }

  // 2. Gateway Verification: Verify directly with Razorpay gateway that funds were captured
  let paidAmountInRupees = 0;
  try {
    const rzp = getRazorpay();
    const paymentEntity = (await rzp.payments.fetch(razorpay_payment_id)) as {
      status?: string;
      order_id?: string;
      amount?: number;
    };
    if (!paymentEntity) {
      throw new Error(`Razorpay payment ${razorpay_payment_id} not found.`);
    }
    const validStatuses = ['captured', 'authorized'];
    if (!paymentEntity.status || !validStatuses.includes(paymentEntity.status)) {
      throw new Error(`Payment ${razorpay_payment_id} has invalid status "${paymentEntity.status}".`);
    }

    // Security Verification: Ensure payment belongs to the expected Razorpay order
    if (paymentEntity.order_id && paymentEntity.order_id !== razorpay_order_id) {
      throw new Error(`Payment ${razorpay_payment_id} belongs to order ${paymentEntity.order_id}, not ${razorpay_order_id}.`);
    }
    paidAmountInRupees = (paymentEntity.amount || 0) / 100;
  } catch (rzpErr: unknown) {
    const msg = rzpErr instanceof Error ? rzpErr.message : 'Unknown gateway error';
    console.error(`[Order Confirmation (${source})] Gateway fetch error:`, msg);
    throw new Error(`Could not verify payment status with Razorpay gateway: ${msg}`);
  }

  // 3. Authoritative Pricing Check: Ensure captured Razorpay amount covers the server-computed cart total
  const pricing = await verifyAndCalculateOrderPricing(orderData.line_items, orderData.coupon_code);
  if (paidAmountInRupees + 1 < pricing.grandTotal) {
    throw new Error(
      `Captured payment (₹${paidAmountInRupees}) is less than order total (₹${pricing.grandTotal}). Order rejected.`
    );
  }

  // 4. Format customer addresses
  const customerId = orderData.customer_id && Number(orderData.customer_id) > 0 ? Number(orderData.customer_id) : undefined;

  const billingAddress = {
    first_name: orderData.billing.first_name || 'Customer',
    last_name: orderData.billing.last_name || '',
    company: '',
    email: orderData.billing.email || 'guest@intersting.duckdns.org',
    phone: orderData.billing.phone || '',
    address_1: orderData.billing.address_1.trim(),
    address_2: (orderData.billing.address_2 || '').trim(),
    city: orderData.billing.city.trim(),
    state: orderData.billing.state.trim(),
    postcode: orderData.billing.postcode.trim(),
    country: orderData.billing.country || 'IN',
  };

  const shippingAddress = orderData.shipping
    ? {
        first_name: orderData.shipping.first_name || billingAddress.first_name,
        last_name: orderData.shipping.last_name || billingAddress.last_name,
        company: '',
        address_1: orderData.shipping.address_1.trim(),
        address_2: (orderData.shipping.address_2 || '').trim(),
        city: orderData.shipping.city.trim(),
        state: orderData.shipping.state.trim(),
        postcode: orderData.shipping.postcode.trim(),
        country: orderData.shipping.country || 'IN',
      }
    : { ...billingAddress };

  // 5. Prepare WooCommerce Order Payload (server-verified items, coupon & shipping)
  const wcPayload: Record<string, unknown> = {
    payment_method: 'razorpay',
    payment_method_title: 'Razorpay Online (UPI / Cards / Netbanking)',
    set_paid: true,
    status: 'processing',
    transaction_id: razorpay_payment_id,
    billing: billingAddress,
    shipping: shippingAddress,
    line_items: pricing.normalizedLineItems,
    shipping_lines: [
      {
        method_id: pricing.shippingFee === 0 ? 'free_shipping' : 'flat_rate',
        method_title: pricing.shippingFee === 0 ? 'Free Express Delivery' : 'Standard Delivery',
        total: String(pricing.shippingFee),
      },
    ],
    meta_data: [
      { key: 'razorpay_order_id', value: razorpay_order_id },
      { key: 'razorpay_payment_id', value: razorpay_payment_id },
      { key: 'payment_verified_at', value: new Date().toISOString() },
      { key: 'confirmed_via', value: source },
    ],
  };

  if (customerId) {
    wcPayload.customer_id = customerId;
  }

  if (pricing.appliedCouponCode) {
    wcPayload.coupon_lines = [{ code: pricing.appliedCouponCode.toLowerCase() }];
  }

  if (orderData.customer_note) {
    wcPayload.customer_note = String(orderData.customer_note).slice(0, 500);
  }

  // 6. Create confirmed Order in WooCommerce
  let order: WooOrder;
  try {
    order = await wcFetch<WooOrder>('orders', {
      method: 'POST',
      body: wcPayload,
    });
  } catch (createErr: unknown) {
    const errMsg = createErr instanceof Error ? createErr.message : 'Unknown error';
    // Log structured non-PII error references to server logs instead of writing customer PII to /tmp
    console.error('[CRITICAL_PAYMENT_ALERT] Payment captured on Razorpay, WooCommerce order creation failed:', {
      razorpay_order_id,
      razorpay_payment_id,
      amount: paidAmountInRupees,
      source,
      error: errMsg,
    });
    throw new Error(`Payment was captured, but order provisioning encountered an error. Please contact support with payment ID ${razorpay_payment_id}.`);
  }

  clearWcCache();
  deletePendingOrder(razorpay_order_id);

  // 7. Update user saved address if logged in
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

  // 8. Send Order Confirmation SMS
  try {
    await sendOrderConfirmationSms(order);
  } catch (smsErr) {
    console.error('[httpSMS] Error sending order SMS:', smsErr);
  }

  return {
    alreadyProcessed: false,
    order,
  };
}
