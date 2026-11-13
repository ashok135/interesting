import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getProductBySlug, getAllProductSlugs, getRelatedProducts } from '@/lib/api/products';
import { getProductReviews, type WooReview } from '@/lib/api/reviews';
import type { WooProduct, WooAttribute } from '@/types';
import { ProductGrid, ProductReviews } from '@/components/product';
import { AddToCartSection } from './AddToCartSection';
import { ProductGallery } from './ProductGallery';
import { formatPrice, stripHtml } from '@/lib/utils/formatters';
import { Badge } from '@/components/ui';
import { Star, CheckCircle2, AlertCircle } from 'lucide-react';
import styles from './page.module.css';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  let product: WooProduct | null = null;
  try {
    product = await getProductBySlug(slug);
  } catch (err) {
    console.error('generateMetadata error:', err);
  }
  if (!product) return { title: 'Product Not Found' };

  const firstImage = Array.isArray(product.images) && product.images[0]?.src ? product.images[0].src : undefined;

  return {
    title: product.name,
    description: stripHtml(product.short_description || product.description || '').slice(0, 160),
    openGraph: {
      images: firstImage ? [{ url: firstImage }] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  let product: WooProduct | null = null;
  try {
    product = await getProductBySlug(slug);
  } catch (err) {
    console.error(`Failed to fetch product for slug "${slug}":`, err);
  }

  if (!product) notFound();

  // Defensively normalize arrays to prevent runtime crashes
  const images = Array.isArray(product.images) ? product.images : [];
  const categories = Array.isArray(product.categories) ? product.categories : [];
  const attributes = Array.isArray(product.attributes) ? product.attributes : [];

  let related: WooProduct[] = [];
  try {
    related = await getRelatedProducts(
      product.id,
      categories[0]?.id,
      4
    );
  } catch (err) {
    console.error('Failed to fetch related products:', err);
    related = [];
  }

  let reviews: WooReview[] = [];
  try {
    reviews = await getProductReviews(product.id);
  } catch (err) {
    console.error('Failed to fetch product reviews:', err);
    reviews = [];
  }

  const reviewsList = Array.isArray(reviews) ? reviews : [];
  const reviewsCount = reviewsList.length;
  const avgRatingNum =
    reviewsCount > 0
      ? reviewsList.reduce((acc, r) => acc + (r.rating || 0), 0) / reviewsCount
      : parseFloat(product.average_rating || '0') || 0;

  const description = stripHtml(product.description || '');
  const isOutOfStock = product.stock_status === 'outofstock';

  const regularPriceNum = parseFloat(product.regular_price || '0');
  const salePriceNum = parseFloat(product.sale_price || '0');
  const hasDiscount = product.on_sale && regularPriceNum > 0 && salePriceNum > 0 && salePriceNum < regularPriceNum;
  const discountPercent = hasDiscount
    ? Math.max(1, Math.round((1 - salePriceNum / regularPriceNum) * 100))
    : 0;

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Product detail */}
        <div className={styles.product}>
          {/* Flipkart / Amazon Style 3-Image Interactive Gallery */}
          <ProductGallery
            images={images}
            productName={product.name || 'Product'}
            onSale={product.on_sale}
            featured={product.featured}
          />

          {/* Info */}
          <div className={styles.info}>
            <div className={styles.infoTop}>
              {categories[0]?.name && (
                <p className={styles.category}>{categories[0].name}</p>
              )}
              <h1 className={styles.name}>{product.name}</h1>

              {reviewsCount > 0 && (
                <div className={styles.rating}>
                  <a href="#customer-reviews" className={styles.stars} style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                    {[1, 2, 3, 4, 5].map((i) => {
                      const filled = i <= Math.round(avgRatingNum);
                      return (
                        <Star
                          key={i}
                          size={14}
                          fill={filled ? '#f59e0b' : '#e2e8f0'}
                          color={filled ? '#f59e0b' : '#cbd5e1'}
                        />
                      );
                    })}
                  </a>
                  <a href="#customer-reviews" className={styles.ratingText}>
                    {avgRatingNum.toFixed(1)} ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
                  </a>
                </div>
              )}

              <div className={styles.priceRow}>
                <span className={styles.price}>{formatPrice(product.price || '0')}</span>
                {hasDiscount && (
                  <>
                    <span className={styles.regularPrice}>{formatPrice(product.regular_price)}</span>
                    <Badge variant="danger">
                      {discountPercent}% OFF
                    </Badge>
                  </>
                )}
              </div>

              <div className={styles.stockRow}>
                <span className={`${styles.stock} ${isOutOfStock ? styles.outOfStock : styles.inStock}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  {isOutOfStock ? (
                    <>
                      <AlertCircle size={15} /> Out of Stock
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} /> In Stock
                    </>
                  )}
                </span>
                {product.sku && (
                  <span className={styles.sku}>SKU: {product.sku}</span>
                )}
              </div>
            </div>

            {/* Add to cart — client component */}
            <AddToCartSection product={product} />

            {/* Description */}
            {description && (
              <div className={styles.descSection}>
                <h2 className={styles.descTitle}>Product Details</h2>
                <p className={styles.desc}>{description}</p>
              </div>
            )}

            {/* Attributes */}
            {attributes.length > 0 && (
              <div className={styles.attrs}>
                {attributes.map((attr: WooAttribute) => (
                  <div key={attr.id || attr.name} className={styles.attr}>
                    <span className={styles.attrName}>{attr.name}:</span>
                    <span className={styles.attrValue}>
                      {Array.isArray(attr.options) ? attr.options.join(', ') : (attr.options || '')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Customer Reviews */}
        <ProductReviews
          productId={product.id}
          productName={product.name || 'Product'}
          initialReviews={reviewsList}
        />

        {/* Related products */}
        {related.length > 0 && (
          <div className={styles.related}>
            <ProductGrid
              products={related}
              title="You May Also Like"
            />
          </div>
        )}
      </div>
    </div>
  );
}
