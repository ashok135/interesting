import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getProductReviews, createProductReview } from '@/lib/api/reviews';

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
    const body = await req.json();
    const { productId, review, rating, reviewer, reviewerEmail } = body;

    if (!productId || !review || !rating || !reviewer || !reviewerEmail) {
      return NextResponse.json(
        { error: 'Please fill in all fields (rating, review, name, email).' },
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

    const newReview = await createProductReview({
      product_id: parseInt(productId, 10),
      review: review.trim(),
      reviewer: reviewer.trim(),
      reviewer_email: reviewerEmail.trim().toLowerCase(),
      rating: numRating,
    });

    try {
      revalidatePath('/');
      revalidatePath('/shop');
    } catch {
      // Background revalidation
    }

    return NextResponse.json({ success: true, review: newReview });
  } catch (error: unknown) {
    console.error('Create review error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to post review';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
