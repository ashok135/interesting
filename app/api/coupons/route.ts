import { NextRequest, NextResponse } from 'next/server';
import { wcFetch } from '@/lib/api/client';

export interface WooCouponItem {
  id: number;
  code: string;
  amount: string;
  discount_type: 'percent' | 'fixed_cart' | 'fixed_product';
  description: string;
  minimum_amount: string;
  maximum_amount: string;
  product_ids?: number[];
  excluded_product_ids?: number[];
  date_expires?: string | null;
  usage_limit?: number | null;
  usage_count?: number;
  free_shipping?: boolean;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (code) {
      // Validate single coupon code from WooCommerce (live, no-store for instant sync)
      const cleanCode = code.trim().toLowerCase();
      const coupons = await wcFetch<WooCouponItem[]>('coupons', {
        params: { code: cleanCode },
        cache: 'no-store',
      });

      if (!Array.isArray(coupons) || coupons.length === 0) {
        return NextResponse.json(
          { valid: false, error: `Coupon "${code}" does not exist in the store.` },
          { status: 404 }
        );
      }

      const coupon = coupons[0];
      return NextResponse.json({
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code.toUpperCase(),
          amount: parseFloat(coupon.amount) || 0,
          discount_type: coupon.discount_type,
          description: coupon.description || `${coupon.discount_type === 'percent' ? coupon.amount + '%' : '₹' + coupon.amount} off`,
          minimum_amount: parseFloat(coupon.minimum_amount) || 0,
          maximum_amount: parseFloat(coupon.maximum_amount) || 0,
          product_ids: Array.isArray(coupon.product_ids) ? coupon.product_ids : [],
          excluded_product_ids: Array.isArray(coupon.excluded_product_ids) ? coupon.excluded_product_ids : [],
          date_expires: coupon.date_expires || null,
          usage_limit: coupon.usage_limit ? Number(coupon.usage_limit) : null,
          usage_count: Number(coupon.usage_count) || 0,
          free_shipping: Boolean(coupon.free_shipping),
        },
      });
    }

    // Fetch active coupons from WooCommerce for hint pills / suggestions
    const coupons = await wcFetch<WooCouponItem[]>('coupons', {
      params: { per_page: 25 },
      cache: 'no-store',
    });

    const now = Date.now();
    const formatted = (Array.isArray(coupons) ? coupons : [])
      .filter((c) => {
        // Exclude expired coupons from recommendation pills
        if (c.date_expires && new Date(c.date_expires).getTime() < now) {
          return false;
        }
        // Exclude exhausted usage limits
        if (c.usage_limit && (c.usage_count || 0) >= c.usage_limit) {
          return false;
        }
        return true;
      })
      .map((c) => ({
        id: c.id,
        code: c.code.toUpperCase(),
        amount: parseFloat(c.amount) || 0,
        discount_type: c.discount_type,
        description: c.description || (
          c.discount_type === 'percent'
            ? `${c.amount}% off`
            : c.discount_type === 'fixed_product'
              ? `₹${c.amount} off per item`
              : `₹${c.amount} flat off`
        ),
        minimum_amount: parseFloat(c.minimum_amount) || 0,
        maximum_amount: parseFloat(c.maximum_amount) || 0,
        product_ids: Array.isArray(c.product_ids) ? c.product_ids : [],
        excluded_product_ids: Array.isArray(c.excluded_product_ids) ? c.excluded_product_ids : [],
        date_expires: c.date_expires || null,
        usage_limit: c.usage_limit ? Number(c.usage_limit) : null,
        usage_count: Number(c.usage_count) || 0,
        free_shipping: Boolean(c.free_shipping),
      }));

    return NextResponse.json({
      success: true,
      coupons: formatted,
    });
  } catch (error: unknown) {
    console.error('Fetch coupons error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch coupons';
    return NextResponse.json({ error: message, coupons: [] }, { status: 500 });
  }
}
