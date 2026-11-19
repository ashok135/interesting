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

const PROD_WC_URL = (process.env.NEXT_PUBLIC_WC_URL || process.env.WC_URL || 'https://intersting.duckdns.org').replace(/\/$/, '');

export function getProductImageUrl(product?: { images?: Array<{ src: string }>; slug?: string; name?: string }): string {
  if (product?.images && product.images.length > 0 && product.images[0]?.src) {
    let src = product.images[0].src.trim();

    if (src.includes('interesting.local') || src.includes('localsite.io')) {
      const m = src.match(/\/wp-content\/uploads\/(.+)$/);
      if (m) {
        src = `${PROD_WC_URL}/wp-content/uploads/${m[1]}`;
      }
    }

    if (src.includes('intersting.duckdns.org') && src.startsWith('http://')) {
      src = src.replace('http://', 'https://');
    }

    if (src.startsWith('/wp-content/uploads/')) {
      src = `${PROD_WC_URL}${src}`;
    }

    if (src.startsWith('/api/media/')) {
      src = `${PROD_WC_URL}/wp-content/uploads/${src.replace('/api/media/', '')}`;
    }

    return src;
  }
  return '';
}
