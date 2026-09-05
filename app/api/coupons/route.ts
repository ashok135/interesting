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
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (code) {
      // Validate single coupon code from WooCommerce
      const cleanCode = code.trim().toLowerCase();
      const coupons = await wcFetch<WooCouponItem[]>('coupons', {
        params: { code: cleanCode },
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
        },
      });
    }

    // Fetch all active coupons from WooCommerce for hint pills / suggestions
    const coupons = await wcFetch<WooCouponItem[]>('coupons', {
      params: { per_page: 20 },
    });

    const formatted = (Array.isArray(coupons) ? coupons : []).map((c) => ({
      id: c.id,
      code: c.code.toUpperCase(),
      amount: parseFloat(c.amount) || 0,
      discount_type: c.discount_type,
      description: c.description || `${c.discount_type === 'percent' ? c.amount + '%' : '₹' + c.amount} off`,
      minimum_amount: parseFloat(c.minimum_amount) || 0,
      maximum_amount: parseFloat(c.maximum_amount) || 0,
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
