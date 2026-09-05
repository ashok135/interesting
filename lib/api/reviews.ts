import { wcFetch } from './client';

export interface WooReview {
  id: number;
  date_created: string;
  product_id: number;
  status: string;
  reviewer: string;
  reviewer_email: string;
  review: string;
  rating: number;
  verified: boolean;
}

export interface CreateReviewData {
  product_id: number;
  review: string;
  reviewer: string;
  reviewer_email: string;
  rating: number;
}

/**
 * Fetch approved customer reviews for a product from WooCommerce
 */
export async function getProductReviews(productId: number): Promise<WooReview[]> {
  try {
    return await wcFetch<WooReview[]>('products/reviews', {
      params: {
        product: productId,
        status: 'approved',
        per_page: 20,
      },
      revalidate: 30,
    });
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return [];
  }
}

/**
 * Post a customer review directly to WooCommerce
 */
export async function createProductReview(data: CreateReviewData): Promise<WooReview> {
  return wcFetch<WooReview>('products/reviews', {
    method: 'POST',
    body: {
      product_id: data.product_id,
      review: data.review,
      reviewer: data.reviewer,
      reviewer_email: data.reviewer_email,
      rating: data.rating,
      status: 'approved', // Auto-approve so user immediately sees their review
    },
    cache: 'no-store',
  });
}
