import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getProductBySlug, getAllProductSlugs, getRelatedProducts } from '@/lib/api/products';
import { getProductReviews } from '@/lib/api/reviews';
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
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product Not Found' };

  return {
    title: product.name,
    description: stripHtml(product.short_description || product.description).slice(0, 160),
    openGraph: {
      images: product.images[0] ? [{ url: product.images[0].src }] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const related = await getRelatedProducts(
    product.id,
    product.categories[0]?.id,
    4
  );

  const reviews = await getProductReviews(product.id);
  const reviewsCount = reviews.length;
  const avgRatingNum =
    reviewsCount > 0
      ? reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviewsCount
      : parseFloat(product.average_rating) || 0;

  const description = stripHtml(product.description);
  const isOutOfStock = product.stock_status === 'outofstock';

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Product detail */}
        <div className={styles.product}>
          {/* Flipkart / Amazon Style 3-Image Interactive Gallery */}
          <ProductGallery
            images={product.images}
            productName={product.name}
            onSale={product.on_sale}
            featured={product.featured}
          />

          {/* Info */}
          <div className={styles.info}>
            <div className={styles.infoTop}>
              {product.categories[0] && (
                <p className={styles.category}>{product.categories[0].name}</p>
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
                <span className={styles.price}>{formatPrice(product.price)}</span>
                {product.on_sale && product.regular_price && (
                  <>
                    <span className={styles.regularPrice}>{formatPrice(product.regular_price)}</span>
                    <Badge variant="danger">
                      {Math.round((1 - parseFloat(product.sale_price) / parseFloat(product.regular_price)) * 100)}% OFF
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
            {product.attributes.length > 0 && (
              <div className={styles.attrs}>
                {product.attributes.map((attr) => (
                  <div key={attr.id} className={styles.attr}>
                    <span className={styles.attrName}>{attr.name}:</span>
                    <span className={styles.attrValue}>{attr.options.join(', ')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Customer Reviews */}
        <ProductReviews
          productId={product.id}
          productName={product.name}
          initialReviews={reviews}
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
