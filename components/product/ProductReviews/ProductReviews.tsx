'use client';

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, PenLine, CheckCircle2 } from 'lucide-react';
import type { WooReview } from '@/lib/api/reviews';
import { useAuth } from '@/store/AuthContext';
import { useToast } from '@/store/ToastContext';
import styles from './ProductReviews.module.css';

interface ProductReviewsProps {
  productId: number;
  productName: string;
  initialReviews?: WooReview[];
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

export default function ProductReviews({
  productId,
  productName,
  initialReviews = [],
}: ProductReviewsProps) {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [reviews, setReviews] = useState<WooReview[]>(initialReviews);
  const [showForm, setShowForm] = useState(false);
  const [hoverRating, setHoverRating] = useState<number>(0);

  // Form State
  const [rating, setRating] = useState<number>(5);
  const [reviewer, setReviewer] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill user details if logged in
  useEffect(() => {
    if (user) {
      if (!reviewer && user.name) setReviewer(user.name);
      if (!reviewerEmail && user.email) setReviewerEmail(user.email);
    }
  }, [user, reviewer, reviewerEmail]);

  // Derived metrics
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / totalReviews).toFixed(1)
      : '0.0';

  // Breakdown counts
  const breakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => Math.round(r.rating) === stars).length;
    const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { stars, count, pct };
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reviewer.trim()) {
      showError('Please enter your name');
      return;
    }
    if (!reviewerEmail.trim() || !reviewerEmail.includes('@')) {
      showError('Please enter a valid email address');
      return;
    }
    if (!reviewText.trim()) {
      showError('Please share your thoughts in the review text');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating,
          reviewer: reviewer.trim(),
          reviewerEmail: reviewerEmail.trim().toLowerCase(),
          review: reviewText.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      showSuccess('Thank you! Your review has been submitted.');

      // Instantly add to state
      if (data.review) {
        setReviews((prev) => [data.review, ...prev]);
      } else {
        // Fallback optimistic review
        setReviews((prev) => [
          {
            id: Date.now(),
            date_created: new Date().toISOString(),
            product_id: productId,
            status: 'approved',
            reviewer: reviewer.trim(),
            reviewer_email: reviewerEmail.trim(),
            review: reviewText.trim(),
            rating,
            verified: Boolean(user),
          },
          ...prev,
        ]);
      }

      // Reset form
      setReviewText('');
      setShowForm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error submitting review';
      showError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#8217;/g, "'").replace(/&#8220;/g, '"').replace(/&#8221;/g, '"');
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section className={styles.reviewsSection} id="customer-reviews">
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>Customer Reviews</h2>
          {totalReviews > 0 && (
            <span className={styles.badge}>{totalReviews} verified {totalReviews === 1 ? 'rating' : 'ratings'}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className={styles.writeBtn}
        >
          {showForm ? 'Cancel Review' : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <PenLine size={16} /> Write a Review
            </span>
          )}
        </button>
      </div>

      {/* Write Review Form */}
      {showForm && (
        <div className={styles.formCard}>
          <h3 className={styles.formTitle}>Review {productName}</h3>
          <p className={styles.formSubtitle}>
            Your honest feedback helps fellow customers choose the best farm-fresh harvest.
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Rating Selector */}
            <div className={styles.ratingSelectGroup}>
              <label className={styles.label}>Your Rating *</label>
              <div className={styles.starButtons}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      className={`${styles.starBtn} ${isActive ? styles.starActive : ''}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      aria-label={`${star} Stars`}
                    >
                      <Star
                        size={22}
                        fill={isActive ? '#f59e0b' : 'none'}
                        color={isActive ? '#f59e0b' : '#94a3b8'}
                      />
                    </button>
                  );
                })}
                <span className={styles.ratingWord}>
                  {RATING_LABELS[hoverRating || rating]}
                </span>
              </div>
            </div>

            {/* Reviewer Details */}
            <div className={styles.inputRow}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="reviewer-name">Your Name *</label>
                <input
                  id="reviewer-name"
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={reviewer}
                  onChange={(e) => setReviewer(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="reviewer-email">Your Email *</label>
                <input
                  id="reviewer-email"
                  type="email"
                  required
                  placeholder="e.g. priya@example.com"
                  value={reviewerEmail}
                  onChange={(e) => setReviewerEmail(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>

            {/* Review Text */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="reviewer-text">Your Review *</label>
              <textarea
                id="reviewer-text"
                required
                rows={4}
                placeholder="What did you like or dislike about this product? (Aroma, quality, taste, freshness...)"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className={styles.textarea}
              />
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={styles.cancelBtn}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Posting Review...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Summary or Empty State */}
      {totalReviews === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <MessageSquare size={40} color="#94a3b8" />
          </div>
          <h3 className={styles.emptyTitle}>No reviews yet</h3>
          <p className={styles.emptySub}>
            Be the first to share your experience with this harvest. Every review helps our community discover genuine produce!
          </p>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className={styles.writeBtn}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <PenLine size={16} /> Be the First to Review
              </span>
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={styles.summaryPanel}>
            <div className={styles.scoreBox}>
              <div className={styles.bigScore}>{averageRating}</div>
              <div className={styles.starRow}>
                {[1, 2, 3, 4, 5].map((i) => {
                  const filled = i <= Math.round(parseFloat(averageRating));
                  return (
                    <Star
                      key={i}
                      size={18}
                      fill={filled ? '#f59e0b' : '#e2e8f0'}
                      color={filled ? '#f59e0b' : '#cbd5e1'}
                    />
                  );
                })}
              </div>
              <div className={styles.scoreMeta}>Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</div>
            </div>

            <div className={styles.breakdown}>
              {breakdown.map(({ stars, count, pct }) => (
                <div key={stars} className={styles.barRow}>
                  <span className={styles.barLabel} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {stars} <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  </span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={styles.barCount}>{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews List */}
          <div className={styles.reviewsList}>
            {reviews.map((rev) => (
              <div key={rev.id} className={styles.reviewCard}>
                <div className={styles.reviewTop}>
                  <div className={styles.reviewerInfo}>
                    <div className={styles.avatar}>
                      {rev.reviewer.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className={styles.reviewerName}>
                        {rev.reviewer}
                        {rev.verified && (
                          <span className={styles.verifiedBadge} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={13} /> Verified
                          </span>
                        )}
                      </div>
                      <div className={styles.reviewDate}>
                        {formatDate(rev.date_created)}
                      </div>
                    </div>
                  </div>

                  <div className={styles.cardStars} style={{ display: 'inline-flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((i) => {
                      const filled = i <= rev.rating;
                      return (
                        <Star
                          key={i}
                          size={15}
                          fill={filled ? '#f59e0b' : '#e2e8f0'}
                          color={filled ? '#f59e0b' : '#cbd5e1'}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className={styles.reviewBody}>
                  {stripHtml(rev.review)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
