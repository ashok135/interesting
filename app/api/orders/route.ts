import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, createOrderAccessToken } from '@/lib/auth/session';
import { wcFetch, clearWcCache } from '@/lib/api/client';
import { updateCustomer } from '@/lib/api/customers';
import { verifyAndCalculateOrderPricing } from '@/lib/payment/pricing';
import { checkRateLimit } from '@/lib/security/rateLimit';
import { sendOrderConfirmationSms } from '@/lib/sms/httpsms';
import type { OrderPayload, WooOrder } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const rl = checkRateLimit(req, { limit: 15, windowMs: 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many order requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSec) } }
      );
    }

    const sessionUser = await getCurrentUser(req);
    const body: OrderPayload = await req.json();

    if (!body.line_items || body.line_items.length === 0) {
      return NextResponse.json(
        { error: 'Cannot create an order with an empty cart.' },
        { status: 400 }
      );
    }

    if (!body.billing || !body.billing.address_1 || !body.billing.city || !body.billing.postcode) {
      return NextResponse.json(
        { error: 'Incomplete delivery address. Please fill in all required fields.' },
        { status: 400 }
      );
    }

    // Security: ONLY assign customer_id from the cryptographically verified session cookie (never trust client body.customer_id!)
    const customerId = sessionUser?.id && Number(sessionUser.id) > 0 ? Number(sessionUser.id) : undefined;

    // Server-side validation of line items, stock, coupon, and shipping fee
    const pricing = await verifyAndCalculateOrderPricing(body.line_items, body.coupon_code);

    const billingAddress = {
      first_name: (body.billing.first_name || sessionUser?.name?.split(' ')[0] || 'Guest').trim().slice(0, 60),
      last_name: (body.billing.last_name || sessionUser?.name?.split(' ').slice(1).join(' ') || '').trim().slice(0, 60),
      company: '',
      email: (body.billing.email || sessionUser?.email || 'guest@intersting.duckdns.org').trim().slice(0, 120),
      phone: (body.billing.phone || '').trim().slice(0, 20),
      address_1: body.billing.address_1.trim().slice(0, 200),
      address_2: (body.billing.address_2 || '').trim().slice(0, 200),
      city: body.billing.city.trim().slice(0, 80),
      state: (body.billing.state || '').trim().slice(0, 80),
      postcode: body.billing.postcode.trim().slice(0, 20),
      country: body.billing.country || 'IN',
    };

    const shippingAddress = body.shipping
      ? {
          first_name: (body.shipping.first_name || billingAddress.first_name).trim().slice(0, 60),
          last_name: (body.shipping.last_name || billingAddress.last_name).trim().slice(0, 60),
          company: '',
          address_1: (body.shipping.address_1 || billingAddress.address_1).trim().slice(0, 200),
          address_2: (body.shipping.address_2 || '').trim().slice(0, 200),
          city: (body.shipping.city || billingAddress.city).trim().slice(0, 80),
          state: (body.shipping.state || billingAddress.state).trim().slice(0, 80),
          postcode: (body.shipping.postcode || billingAddress.postcode).trim().slice(0, 20),
          country: body.shipping.country || 'IN',
        }
      : { ...billingAddress };

    // Only COD or BACS (Direct UPI transfer) may be created directly through /api/orders
    const isCod = (body.payment_method || 'cod').toLowerCase() === 'cod';

    const wcPayload: Record<string, unknown> = {
      payment_method: isCod ? 'cod' : 'bacs',
      payment_method_title: isCod ? 'Pay on Delivery (Cash / UPI)' : 'Direct UPI Transfer',
      set_paid: false, // Security: Direct API orders (COD & UPI) can NEVER self-certify as paid!
      status: isCod ? 'processing' : 'on-hold',
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
    };

    if (customerId) {
      wcPayload.customer_id = customerId;
    }

    if (pricing.appliedCouponCode) {
      wcPayload.coupon_lines = [{ code: pricing.appliedCouponCode.toLowerCase() }];
    }

    if (body.customer_note) {
      wcPayload.customer_note = String(body.customer_note).slice(0, 500);
    }

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

    try {
      await sendOrderConfirmationSms(order);
    } catch (smsErr) {
      console.error('[httpSMS] Non-blocking error sending order SMS:', smsErr);
    }

    const invoiceToken = createOrderAccessToken(order.id, billingAddress.email);

    return NextResponse.json({
      success: true,
      order,
      invoiceToken,
    });
  } catch (error: unknown) {
    console.error('Server order creation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create order.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const rl = checkRateLimit(req, { limit: 30, windowMs: 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSec) } }
      );
    }

    const sessionUser = await getCurrentUser(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || !/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Valid numeric Order ID is required' }, { status: 400 });
    }

    const order = await wcFetch<WooOrder>(`orders/${id}`);
    if (!order || !order.id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Security & Privacy Check: Prevent Insecure Direct Object Reference (IDOR)
    const orderCustomerId = order.customer_id ? Number(order.customer_id) : null;
    const sessionUserId = sessionUser?.id ? Number(sessionUser.id) : null;
    const orderEmail = order.billing?.email?.toLowerCase().trim();
    const sessionEmail = sessionUser?.email?.toLowerCase().trim();

    const isOwner =
      Boolean(orderCustomerId && sessionUserId && orderCustomerId === sessionUserId) ||
      Boolean(orderEmail && sessionEmail && orderEmail === sessionEmail);

    if (isOwner) {
      return NextResponse.json({ success: true, order });
    }

    // Guest verification requires matching non-placeholder email OR full 10-digit phone match
    const queryEmail = searchParams.get('email')?.toLowerCase().trim();
    const rawQueryPhone = searchParams.get('phone')?.replace(/[^0-9]/g, '') || '';
    const billingPhone = order.billing?.phone?.replace(/[^0-9]/g, '') || '';

    const isRealOrderEmail = Boolean(
      orderEmail &&
      orderEmail !== 'guest@interestingstore.com' &&
      orderEmail !== 'guest@intersting.duckdns.org'
    );
    const isPhoneMatch =
      rawQueryPhone.length >= 10 &&
      billingPhone.length >= 10 &&
      billingPhone.slice(-10) === rawQueryPhone.slice(-10);

    const isGuestVerified =
      Boolean(isRealOrderEmail && queryEmail && orderEmail === queryEmail) ||
      isPhoneMatch;

    if (isGuestVerified) {
      return NextResponse.json({ success: true, order });
    }

    // Unauthenticated guest tracking: return masked/sanitized order (no PII leaked)
    const maskedOrder = {
      id: order.id,
      status: order.status,
      date_created: order.date_created,
      date_modified: order.date_modified,
      total: order.total,
      payment_method_title: order.payment_method_title,
      line_items: order.line_items?.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        total: item.total,
        image: item.image,
      })),
      shipping: {
        first_name: order.shipping?.first_name ? `${order.shipping.first_name[0]}***` : 'Customer',
        last_name: '',
        city: order.shipping?.city || order.billing?.city,
        state: order.shipping?.state || order.billing?.state,
        postcode: order.shipping?.postcode ? `${order.shipping.postcode.slice(0, 3)}***` : '',
        country: order.shipping?.country || 'IN',
      },
      is_guest_view: true,
    };

    return NextResponse.json({ success: true, order: maskedOrder });
  } catch (error: unknown) {
    console.error('Get order error:', error);
    return NextResponse.json({ error: 'Failed to retrieve order.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const rl = checkRateLimit(req, { limit: 10, windowMs: 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many cancellation requests. Please wait a minute.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSec) } }
      );
    }

    const sessionUser = await getCurrentUser(req);
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Please sign in to cancel your order.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const orderId = Number(body.id || body.orderId);
    const reason = String(body.reason || 'Cancelled by customer').trim().slice(0, 200);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json(
        { error: 'Valid Order ID is required.' },
        { status: 400 }
      );
    }

    // Retrieve the existing order from WooCommerce
    const existingOrder = await wcFetch<WooOrder>(`orders/${orderId}`, { cache: 'no-store' });
    if (!existingOrder || !existingOrder.id) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // Security check: order customer ID or email must match logged-in user
    const orderCustomerId = existingOrder.customer_id ? Number(existingOrder.customer_id) : null;
    const sessionUserId = sessionUser.id ? Number(sessionUser.id) : null;
    const orderEmail = existingOrder.billing?.email?.toLowerCase().trim();
    const sessionEmail = sessionUser.email?.toLowerCase().trim();

    const isOwner =
      (orderCustomerId && sessionUserId && orderCustomerId === sessionUserId) ||
      (orderEmail && sessionEmail && orderEmail === sessionEmail);

    if (!isOwner) {
      return NextResponse.json(
        { error: 'You do not have permission to cancel this order.' },
        { status: 403 }
      );
    }

    // Check if order is in a cancellable status
    const currentStatus = (existingOrder.status || '').toLowerCase();
    if (['completed', 'cancelled', 'refunded', 'failed'].includes(currentStatus)) {
      return NextResponse.json(
        { error: `Order #${orderId} cannot be cancelled because it is already ${currentStatus}.` },
        { status: 400 }
      );
    }

    // Update status to 'cancelled' in WooCommerce
    const notePrefix = existingOrder.customer_note ? `${existingOrder.customer_note} | ` : '';
    const updatedNote = `${notePrefix}Cancelled by customer: ${reason}`;

    const updatedOrder = await wcFetch<WooOrder>(`orders/${orderId}`, {
      method: 'PUT',
      body: {
        status: 'cancelled',
        customer_note: updatedNote,
      },
    });

    // Invalidate caches so the updated status reflects immediately
    clearWcCache();

    return NextResponse.json({
      success: true,
      message: `Order #${orderId} has been cancelled successfully.`,
      order: updatedOrder,
    });
  } catch (error: unknown) {
    console.error('Cancel order error:', error);
    const message = error instanceof Error ? error.message : 'Failed to cancel order.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
