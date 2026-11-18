/**
 * Environment configuration validator & access helper.
 * Provides early warnings if critical variables are missing in production.
 */

interface EnvConfig {
  wcUrl: string;
  hasWcAuth: boolean;
  hasRazorpay: boolean;
  hasNvidia: boolean;
  isProduction: boolean;
}

export function getValidatedEnv(): EnvConfig {
  const isProduction = process.env.NODE_ENV === 'production';

  const wcUrl = process.env.NEXT_PUBLIC_WC_URL || 'https://intersting.duckdns.org';
  const hasWcAuth = !!(
    (process.env.WC_CONSUMER_KEY && process.env.WC_CONSUMER_SECRET) ||
    (process.env.WC_APP_USER && process.env.WC_APP_PASSWORD)
  );
  const hasRazorpay = !!(
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  );
  const hasNvidia = !!process.env.NVIDIA_API_KEY;

  if (isProduction) {
    if (!hasWcAuth) {
      console.error('[ENV WARNING] WooCommerce API credentials (WC_CONSUMER_KEY/SECRET) are missing!');
    }
    if (!hasRazorpay) {
      console.warn('[ENV WARNING] Razorpay API credentials are not fully configured.');
    }
    if (!hasNvidia) {
      console.warn('[ENV WARNING] NVIDIA_API_KEY is missing. AI assistant will operate in fallback mode.');
    }
  }

  return {
    wcUrl,
    hasWcAuth,
    hasRazorpay,
    hasNvidia,
    isProduction,
  };
}
