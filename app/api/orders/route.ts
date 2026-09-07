import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { wcFetch, clearWcCache } from '@/lib/api/client';
import { updateCustomer } from '@/lib/api/customers';
import type { OrderPayload, WooOrder } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
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

    // Determine customer ID (logged-in user takes precedence)
    let customerId: number | undefined = undefined;
    if (sessionUser?.id && Number(sessionUser.id) > 0) {
      customerId = Number(sessionUser.id);
    } else if (body.customer_id && Number(body.customer_id) > 0) {
      customerId = Number(body.customer_id);
    }

    // Format billing and shipping addresses
    const billingAddress = {
      first_name: body.billing.first_name || sessionUser?.name?.split(' ')[0] || 'Guest',
      last_name: body.billing.last_name || sessionUser?.name?.split(' ').slice(1).join(' ') || '',
      company: '',
      email: body.billing.email || sessionUser?.email || 'guest@interestingstore.com',
      phone: body.billing.phone || '',
      address_1: body.billing.address_1.trim(),
      address_2: (body.billing.address_2 || '').trim(),
      city: body.billing.city.trim(),
      state: body.billing.state.trim(),
      postcode: body.billing.postcode.trim(),
      country: body.billing.country || 'IN',
    };

    const shippingAddress = body.shipping ? {
      first_name: body.shipping.first_name || billingAddress.first_name,
      last_name: body.shipping.last_name || billingAddress.last_name,
      company: '',
      address_1: body.shipping.address_1.trim(),
      address_2: (body.shipping.address_2 || '').trim(),
      city: body.shipping.city.trim(),
      state: body.shipping.state.trim(),
      postcode: body.shipping.postcode.trim(),
      country: body.shipping.country || 'IN',
    } : { ...billingAddress };

    const isCod = (body.payment_method || 'cod').toLowerCase() === 'cod';

    // Build payload for WooCommerce REST API
    const wcPayload: Record<string, unknown> = {
      payment_method: isCod ? 'cod' : (body.payment_method || 'bacs'),
      payment_method_title: isCod ? 'Cash on Delivery' : (body.payment_method_title || 'Online Payment'),
      set_paid: isCod ? false : (body.set_paid ?? false),
      // Cash on Delivery is confirmed immediately -> status 'processing' (not 'pending')
      status: isCod ? 'processing' : (body.set_paid ? 'processing' : 'pending'),
      billing: billingAddress,
      shipping: shippingAddress,
      line_items: body.line_items.map((item) => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity) || 1,
      })),
    };

    if (customerId) {
      wcPayload.customer_id = customerId;
    }

    // Apply coupon directly through WooCommerce if provided
    if (body.coupon_code) {
      wcPayload.coupon_lines = [{ code: body.coupon_code.trim().toLowerCase() }];
    } else if (body.discount_amount && body.discount_amount > 0) {
      // Fallback discount fee if no coupon code
      wcPayload.fee_lines = [
        {
          name: 'Special Discount',
          total: `-${Number(body.discount_amount).toFixed(2)}`,
        },
      ];
    }

    // Handle shipping lines
    if (body.shipping_lines && body.shipping_lines.length > 0) {
      wcPayload.shipping_lines = body.shipping_lines;
    }

    if (body.customer_note) {
      wcPayload.customer_note = body.customer_note;
    }

    // Call WooCommerce API from server with full credentials
    const order = await wcFetch<WooOrder>('orders', {
      method: 'POST',
      body: wcPayload,
    });

    // Invalidate order cache so new order shows up immediately in user account
    clearWcCache();

    // If customer is logged in, optionally save their latest address to their customer record
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

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error: unknown) {
    console.error('Server order creation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create order.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await wcFetch<WooOrder>(`orders/${id}`);
    return NextResponse.json({ success: true, order });
  } catch (error: unknown) {
    console.error('Get order error:', error);
    const message = error instanceof Error ? error.message : 'Failed to retrieve order.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const sessionUser = await getCurrentUser(req);
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Please sign in to cancel your order.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const orderId = Number(body.id || body.orderId);
    const reason = (body.reason || 'Cancelled by customer').trim();

    if (!orderId || isNaN(orderId)) {
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
