/**
 * Formats a price string to Indian Rupee format
 */
export function formatPrice(price: string | number): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Strips HTML tags from a string (WooCommerce returns HTML descriptions)
 */
export function stripHtml(html?: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Truncates a string to a given length with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trim() + '…';
}

/**
 * Calculates cart total from items
 */
export function calculateCartTotal(items: Array<{ price: string; quantity: number }>): string {
  const total = items.reduce((sum, item) => {
    return sum + parseFloat(item.price) * item.quantity;
  }, 0);
  return total.toFixed(2);
}

/**
 * Calculates total item count in cart
 */
export function calculateItemCount(items: Array<{ quantity: number }>): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

// Fallback image if WooCommerce product doesn't have an image uploaded yet
const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&q=80';
const PROD_WC_URL = (process.env.NEXT_PUBLIC_WC_URL || process.env.WC_URL || 'https://intersting.duckdns.org').replace(/\/$/, '');

const OPTIMIZED_PRODUCTS = new Set([
  'hamper-casket-1',
  'packaging-tin-seal-1',
  'purity-quality-seal-1',
  'hamper-gold',
  'dryfruit-chikki',
  'gourmet-laddu',
  'trad-kajukatli-1',
  'trail-mix-omega',
  'dryfruit-berries',
  'nuts-pistachios',
  'nuts-almonds',
  'nuts-cashews-1',
  'makhana-roasted',
  'roasted-chana-1',
  'dryfruit-raisins-1',
  'dryfruit-dates-1',
  'dryfruit-anjeer',
  'seeds-mix-1',
  'seeds-pumpkin-1',
  'seeds-chia-1',
  'nuts-walnuts-1',
]);

export function getProductImageUrl(product?: { images?: Array<{ src: string }>; slug?: string; name?: string }): string {
  if (product?.images && product.images.length > 0 && product.images[0]?.src) {
    const src = product.images[0].src;

    if (src.startsWith('/images/products/')) return src;

    const match = src.match(/(?:\/wp-content\/uploads\/|\/api\/media\/)(?:.*\/)?([^/]+)\.(?:jpe?g|png|webp)$/i);
    if (match) {
      const basename = match[1];
      if (OPTIMIZED_PRODUCTS.has(basename)) {
        return `/images/products/${basename}.webp`;
      }
      const relativePath = src
        .replace(/^https?:\/\/[^/]+\/wp-content\/uploads\//, '')
        .replace(/^\/wp-content\/uploads\//, '')
        .replace(/^\/api\/media\//, '');
      return `/api/media/${relativePath}`;
    }

    return src;
  }
  return FALLBACK_PRODUCT_IMAGE;
}
