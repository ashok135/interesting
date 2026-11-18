import { NextRequest, NextResponse } from 'next/server';
import { createRazorpayOrder } from '@/lib/payment/razorpay';
import { getCurrentUser } from '@/lib/auth/session';
import { setPendingOrder } from '@/lib/payment/pendingOrders';
import { getProducts } from '@/lib/api/products';
import { wcFetch } from '@/lib/api/client';
import { checkRateLimit } from '@/lib/security/rateLimit';
import type { OrderPayload } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting: 15 checkout attempts per minute per IP
    const rl = checkRateLimit(req, { limit: 15, windowMs: 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many payment requests. Please wait a moment before trying again.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSec) } }
      );
    }

    const sessionUser = await getCurrentUser(req);
    const body = await req.json();
    const {
      amount,
      receipt,
      notes,
      orderData,
    }: {
      amount: number;
      receipt?: string;
      notes?: Record<string, string>;
      orderData?: OrderPayload;
    } = body;

    const numAmount = parseFloat(String(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid order amount.' },
        { status: 400 }
      );
    }

    const orderNotes: Record<string, string> = {
      ...(notes || {}),
      customer_email: sessionUser?.email || notes?.customer_email || 'guest@interestingstore.com',
      created_at: new Date().toISOString(),
    };

    if (orderData?.billing) {
      orderNotes.customer_name = `${orderData.billing.first_name || ''} ${orderData.billing.last_name || ''}`.trim() || 'Customer';
      if (orderData.billing.phone) orderNotes.customer_phone = orderData.billing.phone;
      if (orderData.billing.city) orderNotes.city = orderData.billing.city;
      if (orderData.billing.postcode) orderNotes.pincode = orderData.billing.postcode;
      if (orderData.billing.address_1) orderNotes.address_1 = orderData.billing.address_1.slice(0, 100);
      if (orderData.billing.state) orderNotes.state = orderData.billing.state.slice(0, 50);
    }

    let finalChargeAmount = numAmount;

    // 2. Server-Side Price & Stock Verification: Fetch live product details from WooCommerce
    if (orderData?.line_items && orderData.line_items.length > 0) {
      const productIds = orderData.line_items
        .map((i) => Number(i.product_id))
        .filter((id) => !isNaN(id) && id > 0);

      const products = await getProducts({ include: productIds, perPage: 50 });
      const productMap = new Map<number, { price: number; stock_status?: string; stock_quantity?: number | null; name: string }>();

      products.forEach((p) => {
        const pPrice = parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 0;
        productMap.set(p.id, {
          price: pPrice,
          stock_status: p.stock_status,
          stock_quantity: p.stock_quantity,
          name: p.name,
        });
      });

      // Stock check
      for (const item of orderData.line_items) {
        const pInfo = productMap.get(Number(item.product_id));
        if (!pInfo) continue;

        if (pInfo.stock_status === 'outofstock') {
          return NextResponse.json(
            { error: `"${pInfo.name}" is currently out of stock. Please remove it from your cart to proceed.` },
            { status: 400 }
          );
        }

        const requestedQty = Number(item.quantity) || 1;
        if (pInfo.stock_quantity !== null && pInfo.stock_quantity !== undefined && requestedQty > pInfo.stock_quantity) {
          return NextResponse.json(
            { error: `Only ${pInfo.stock_quantity} units of "${pInfo.name}" are available in stock (you requested ${requestedQty}).` },
            { status: 400 }
          );
        }
      }

      // Calculate server authoritative subtotal
      let serverSubtotal = 0;
      for (const item of orderData.line_items) {
        const pInfo = productMap.get(Number(item.product_id));
        if (pInfo) {
          serverSubtotal += pInfo.price * (Number(item.quantity) || 1);
        }
      }

      // 3. Server-Side Coupon Verification
      let discountAmount = 0;
      if (orderData.coupon_code) {
        const cleanCouponCode = orderData.coupon_code.trim().toLowerCase();
        try {
          const coupons = await wcFetch<any[]>('coupons', {
            params: { code: cleanCouponCode },
          });

          if (Array.isArray(coupons) && coupons.length > 0) {
            const coupon = coupons[0];
            const minSpend = parseFloat(coupon.minimum_amount) || 0;
            const maxSpend = parseFloat(coupon.maximum_amount) || 0;
            const cAmount = parseFloat(coupon.amount) || 0;

            if (minSpend > 0 && serverSubtotal < minSpend) {
              console.warn(`[Coupon Check] Coupon ${cleanCouponCode} requires min spend of ₹${minSpend}.`);
            } else if (maxSpend > 0 && serverSubtotal > maxSpend) {
              console.warn(`[Coupon Check] Coupon ${cleanCouponCode} exceeds max spend of ₹${maxSpend}.`);
            } else {
              if (coupon.discount_type === 'percent') {
                discountAmount = (serverSubtotal * cAmount) / 100;
              } else if (coupon.discount_type === 'fixed_cart') {
                discountAmount = Math.min(serverSubtotal, cAmount);
              }
              orderNotes.coupon_code = cleanCouponCode.toUpperCase();
            }
          }
        } catch (couponErr) {
          console.warn('[Coupon Check] Failed to verify coupon on server:', couponErr);
        }
      }

      if (serverSubtotal > 0) {
        const serverTotalAfterDiscount = Math.max(0, serverSubtotal - discountAmount);
        const shippingFee = serverTotalAfterDiscount >= 499 ? 0 : 50;
        const calculatedTotal = serverTotalAfterDiscount + shippingFee;

        // Authoritative enforcement: client cannot underpay
        if (numAmount < calculatedTotal - 1) {
          console.warn(`[Security Alert] Price tampering blocked. Client sent ₹${numAmount}, server enforced ₹${calculatedTotal}`);
          finalChargeAmount = calculatedTotal;
        } else {
          finalChargeAmount = calculatedTotal;
        }
      }

      // Encode compact items into Razorpay notes for resilient recovery
      orderNotes.items_compact = orderData.line_items
        .map((i) => `${i.product_id}:${i.quantity}`)
        .join(',');
    }

    const order = await createRazorpayOrder({
      amountInRupees: finalChargeAmount,
      receipt: receipt || `ord_${Date.now()}`,
      notes: orderNotes,
    });

    // Store pending order details in memory & disk cache for both browser callback and webhook
    if (orderData) {
      setPendingOrder(order.id, orderData);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment gateway order.' },
      { status: 500 }
    );
  }
}
