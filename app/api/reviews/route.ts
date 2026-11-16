import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { wcFetch, clearWcCache } from '@/lib/api/client';
import { getProductReviews, createProductReview } from '@/lib/api/reviews';
import type { WooOrder } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const reviews = await getProductReviews(parseInt(productId, 10));
    return NextResponse.json({ reviews });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch reviews';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getCurrentUser(req);
    const body = await req.json();
    const { productId, review, rating, reviewer, reviewerEmail, orderId } = body;

    if (!productId || !review || !rating) {
      return NextResponse.json(
        { error: 'Please provide rating, review text, and product ID.' },
        { status: 400 }
      );
    }

    const numRating = parseInt(rating, 10);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5 stars.' },
        { status: 400 }
      );
    }

    const targetProductId = parseInt(productId, 10);
    const targetEmail = (reviewerEmail || sessionUser?.email || '').trim().toLowerCase();
    const targetName = (reviewer || sessionUser?.name || 'Verified Customer').trim();

    if (!targetEmail || !targetEmail.includes('@')) {
      return NextResponse.json(
        { error: 'A valid customer email is required to verify your purchase.' },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // STRICT AMAZON / FLIPKART VERIFIED PURCHASE VERIFICATION:
    // Only customers with a 'completed' (Delivered) order can review!
    // ─────────────────────────────────────────────────────────────
    let isVerifiedPurchase = false;

    if (orderId && Number(orderId) > 0) {
      // Direct verification via specified Order ID (e.g., from Account Order card)
      try {
        const order = await wcFetch<WooOrder>(`orders/${Number(orderId)}`, { cache: 'no-store' });
        if (order && order.id) {
          const orderStatus = (order.status || '').toLowerCase();
          const orderEmail = (order.billing?.email || '').toLowerCase().trim();
          const orderCustId = order.customer_id ? Number(order.customer_id) : null;
          const sessionUserId = sessionUser?.id ? Number(sessionUser.id) : null;

          const emailMatches = orderEmail === targetEmail;
          const userMatches = sessionUserId && orderCustId && sessionUserId === orderCustId;

          if ((emailMatches || userMatches) && orderStatus === 'completed') {
            const hasItem = Array.isArray(order.line_items) && order.line_items.some(
              (item) => Number(item.product_id) === targetProductId
            );
            if (hasItem) {
              isVerifiedPurchase = true;
            }
          }
        }
      } catch (err) {
        console.warn(`Order #${orderId} lookup failed during review verification:`, err);
      }
    }

    if (!isVerifiedPurchase) {
      // Query completed orders for this customer (via customer_id or email)
      try {
        let candidateOrders: WooOrder[] = [];

        if (sessionUser?.id && Number(sessionUser.id) > 0) {
          const userOrders = await wcFetch<WooOrder[]>('orders', {
            params: {
              customer: sessionUser.id,
              status: 'completed',
              per_page: 50,
            },
            cache: 'no-store',
          });
          if (Array.isArray(userOrders)) {
            candidateOrders.push(...userOrders);
          }
        }

        // Also search by email to cover guest checkouts or differing user records
        if (candidateOrders.length === 0 && targetEmail) {
          const emailOrders = await wcFetch<WooOrder[]>('orders', {
            params: {
              search: targetEmail,
              status: 'completed',
              per_page: 50,
            },
            cache: 'no-store',
          });
          if (Array.isArray(emailOrders)) {
            candidateOrders.push(...emailOrders);
          }
        }

        // Search candidate orders for completed delivery of this product
        for (const ord of candidateOrders) {
          if ((ord.status || '').toLowerCase() === 'completed') {
            const hasItem = Array.isArray(ord.line_items) && ord.line_items.some(
              (item) => Number(item.product_id) === targetProductId
            );
            if (hasItem) {
              isVerifiedPurchase = true;
              break;
            }
          }
        }
      } catch (err) {
        console.error('Failed to query orders for purchase verification:', err);
      }
    }

    // If still not verified as a delivered order, reject submission
    if (!isVerifiedPurchase) {
      return NextResponse.json(
        {
          error: 'Verified Purchase Required: Only customers who have ordered and received delivery of this product can write a review.',
          code: 'VERIFIED_PURCHASE_REQUIRED',
        },
        { status: 403 }
      );
    }

    // Customer has a verified delivered order -> create review with verified badge
    const newReview = await createProductReview({
      product_id: targetProductId,
      review: review.trim(),
      reviewer: targetName,
      reviewer_email: targetEmail,
      rating: numRating,
      verified: true,
    });

    try {
      clearWcCache();
      revalidatePath(`/product/[slug]`, 'page');
      revalidatePath('/shop');
      revalidatePath('/');
    } catch {
      // Background revalidation
    }

    return NextResponse.json({
      success: true,
      review: newReview,
      verified: true,
      message: 'Verified review posted successfully.',
    });
  } catch (error: unknown) {
    console.error('Create review error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to post review';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
