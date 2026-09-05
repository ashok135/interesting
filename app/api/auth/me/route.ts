import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { findCustomerByEmail, getCustomerById, getCustomerOrders, type WooCustomer } from '@/lib/api/customers';
import { wcFetch } from '@/lib/api/client';
import type { WooOrder } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ user: null, customer: null, orders: [] });
    }

    // 1. Fetch full WooCommerce customer record (try by ID first, then by email)
    let customer: WooCustomer | null = null;
    if (user.id && Number(user.id) > 0) {
      customer = await getCustomerById(Number(user.id));
    }
    if (!customer && user.email) {
      customer = await findCustomerByEmail(user.email);
    }

    // 2. Fetch orders by customer ID
    const customerId = customer?.id || (user.id ? Number(user.id) : undefined);
    let orders: WooOrder[] = [];

    if (customerId) {
      orders = await getCustomerOrders(customerId);
    }

    // Fallback: If no orders found by customer ID, search orders by user's email
    if ((!orders || orders.length === 0) && user.email) {
      try {
        const searchOrders = await wcFetch<WooOrder[]>('orders', {
          params: { search: user.email.toLowerCase().trim(), per_page: 20 },
          cache: 'no-store',
        });
        if (Array.isArray(searchOrders)) {
          orders = searchOrders;
        }
      } catch (searchErr) {
        console.warn('Orders email search failed:', searchErr);
      }
    }

    // Ensure all line item image URLs use the authenticated local proxy
    orders = orders.map((order) => {
      if (order.line_items) {
        order.line_items = order.line_items.map((item) => {
          if (item.image?.src && item.image.src.includes('/wp-content/uploads/')) {
            const parts = item.image.src.split('/wp-content/uploads/');
            item.image.src = `/api/media/${parts[1]}`;
          }
          return item;
        });
      }
      return order;
    });

    // If customer object wasn't found in WooCommerce (e.g. admin or WP user role),
    // build a fallback customer record from user & their most recent order addresses
    if (!customer) {
      const latestOrder = orders[0];
      const nameParts = (user.name || '').trim().split(' ');
      customer = {
        id: user.id,
        email: user.email,
        first_name: latestOrder?.billing?.first_name || nameParts[0] || '',
        last_name: latestOrder?.billing?.last_name || nameParts.slice(1).join(' ') || '',
        role: 'customer',
        username: user.email.split('@')[0],
        avatar_url: user.avatar,
        date_created: latestOrder?.date_created || new Date().toISOString(),
        billing: {
          first_name: latestOrder?.billing?.first_name || nameParts[0] || '',
          last_name: latestOrder?.billing?.last_name || nameParts.slice(1).join(' ') || '',
          company: '',
          address_1: latestOrder?.billing?.address_1 || '',
          address_2: latestOrder?.billing?.address_2 || '',
          city: latestOrder?.billing?.city || '',
          state: latestOrder?.billing?.state || '',
          postcode: latestOrder?.billing?.postcode || '',
          country: latestOrder?.billing?.country || 'IN',
          email: user.email,
          phone: latestOrder?.billing?.phone || '',
        },
        shipping: {
          first_name: latestOrder?.shipping?.first_name || latestOrder?.billing?.first_name || nameParts[0] || '',
          last_name: latestOrder?.shipping?.last_name || latestOrder?.billing?.last_name || nameParts.slice(1).join(' ') || '',
          company: '',
          address_1: latestOrder?.shipping?.address_1 || latestOrder?.billing?.address_1 || '',
          address_2: latestOrder?.shipping?.address_2 || latestOrder?.billing?.address_2 || '',
          city: latestOrder?.shipping?.city || latestOrder?.billing?.city || '',
          state: latestOrder?.shipping?.state || latestOrder?.billing?.state || '',
          postcode: latestOrder?.shipping?.postcode || latestOrder?.billing?.postcode || '',
          country: latestOrder?.shipping?.country || latestOrder?.billing?.country || 'IN',
        },
      };
    }

    return NextResponse.json({
      user,
      customer,
      orders,
    });
  } catch (error) {
    console.error('Auth /me error:', error);
    return NextResponse.json({ user: null, customer: null, orders: [] }, { status: 500 });
  }
}
