import fs from 'fs';
import path from 'path';
import os from 'os';
import { wcFetch, clearWcCache } from '@/lib/api/client';
import { updateCustomer } from '@/lib/api/customers';
import { sendOrderConfirmationSms } from '@/lib/sms/httpsms';
import { getRazorpay } from '@/lib/payment/razorpay';
import { deletePendingOrder } from './pendingOrders';
import type { OrderPayload, WooOrder } from '@/types';

const ORPHANED_LOG_FILE = path.join(os.tmpdir(), 'intersting_orphaned_payments.json');

function logOrphanedPayment(record: Record<string, any>) {
  try {
    let existing: any[] = [];
    if (fs.existsSync(ORPHANED_LOG_FILE)) {
      existing = JSON.parse(fs.readFileSync(ORPHANED_LOG_FILE, 'utf-8')) || [];
    }
    existing.push({ ...record, logged_at: new Date().toISOString() });
    fs.writeFileSync(ORPHANED_LOG_FILE, JSON.stringify(existing, null, 2), 'utf-8');
    console.warn(`[OrphanedPayments] Successfully recorded failed transaction to: ${ORPHANED_LOG_FILE}`);
  } catch (err) {
    console.error('[OrphanedPayments] Failed to record orphaned payment to disk:', err);
  }
}

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
        per_page: 1,
      },
    });

    if (Array.isArray(existing) && existing.length > 0) {
      const match = existing.find(
        (o) =>
          o.transaction_id === razorpay_payment_id ||
          o.meta_data?.some((m) => m.key === 'razorpay_payment_id' && m.value === razorpay_payment_id)
      );

      if (match) {
        console.log(`[Order Confirmation (${source})] Order #${match.id} already exists for payment ${razorpay_payment_id}. Skipping creation.`);
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
  try {
    const rzp = getRazorpay();
    const paymentEntity = await rzp.payments.fetch(razorpay_payment_id) as any;
    if (!paymentEntity) {
      throw new Error(`Razorpay payment ${razorpay_payment_id} not found.`);
    }
    const validStatuses = ['captured', 'authorized'];
    if (!validStatuses.includes(paymentEntity.status)) {
      throw new Error(`Payment ${razorpay_payment_id} has invalid status "${paymentEntity.status}".`);
    }

    // Security Verification: Ensure payment belongs to the expected Razorpay order
    if (paymentEntity.order_id && paymentEntity.order_id !== razorpay_order_id) {
      throw new Error(`Payment ${razorpay_payment_id} belongs to order ${paymentEntity.order_id}, not ${razorpay_order_id}.`);
    }
    console.log(`[Order Confirmation (${source})] Gateway verified: payment ${razorpay_payment_id} is ${paymentEntity.status} for ₹${(paymentEntity.amount || 0) / 100}`);
  } catch (rzpErr: any) {
    console.error(`[Order Confirmation (${source})] Gateway fetch error:`, rzpErr.message);
    throw new Error(`Could not verify payment status with Razorpay gateway: ${rzpErr.message}`);
  }

  // 3. Format customer addresses
  const customerId = orderData.customer_id && Number(orderData.customer_id) > 0 ? Number(orderData.customer_id) : undefined;

  const billingAddress = {
    first_name: orderData.billing.first_name || 'Customer',
    last_name: orderData.billing.last_name || '',
    company: '',
    email: orderData.billing.email || 'guest@interestingstore.com',
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

  // 3. Prepare WooCommerce Order Payload
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
      { key: 'confirmed_via', value: source },
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
  let order: WooOrder;
  try {
    order = await wcFetch<WooOrder>('orders', {
      method: 'POST',
      body: wcPayload,
    });
  } catch (createErr: any) {
    console.error(`[CRITICAL_PAYMENT_ALERT] Payment was CAPTURED on Razorpay (${razorpay_payment_id}), but WooCommerce order creation failed:`, createErr.message);
    logOrphanedPayment({
      razorpay_order_id,
      razorpay_payment_id,
      wcPayload,
      errorMessage: createErr.message,
      source,
    });
    throw new Error(`Payment was captured, but WooCommerce order provisioning encountered an error: ${createErr.message}. Admin has been notified.`);
  }

  clearWcCache();
  deletePendingOrder(razorpay_order_id);

  // 5. Update user saved address if logged in
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

  // 6. Send Order Confirmation SMS
  try {
    const smsResult = await sendOrderConfirmationSms(order);
    console.log(`[httpSMS] Razorpay Order #${order.id} (${source}) SMS sent:`, JSON.stringify(smsResult));
  } catch (smsErr) {
    console.error('[httpSMS] Error sending order SMS:', smsErr);
  }

  return {
    alreadyProcessed: false,
    order,
  };
}
