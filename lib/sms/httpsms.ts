/**
 * httpSMS (https://httpsms.com) API Service
 * Dispatches automated SMS messages via Android SMS gateway.
 */

import type { WooOrder } from '@/types';

export interface SendSmsOptions {
  to: string;
  content: string;
  from?: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
}

// Known catalog product slug mappings for clean SMS links
const PRODUCT_SLUGS_BY_ID: Record<number, string> = {
  54: 'royal-gond-dry-fruit-nutri-laddu',
  55: 'jaggery-crushed-nut-artisanal-chikki',
  51: 'energy-crunch-pre-workout-trail',
  49: 'gourmet-omega-3-vitality-trail-mix',
  48: 'lightly-salted-california-pistachios',
  42: 'himalayan-pink-salt-popped-makhana',
};

/**
 * Resolves the public storefront URL for SMS links.
 * Prioritizes Vercel production domains so customers are directed to the live Next.js store,
 * rather than the raw WooCommerce WordPress backend.
 */
export function getStorefrontUrl(): string {
  const wcUrl = (process.env.NEXT_PUBLIC_WC_URL || '').replace(/\/$/, '');
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');

  // 1. If an explicit custom site URL is set (and not pointing to WordPress backend)
  if (siteUrl && siteUrl !== wcUrl && !siteUrl.includes('duckdns.org')) {
    return siteUrl;
  }

  // 2. Vercel production custom domain / primary project URL
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, '');
  }

  // 3. Vercel deployment URL
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    const v = process.env.NEXT_PUBLIC_VERCEL_URL.startsWith('http')
      ? process.env.NEXT_PUBLIC_VERCEL_URL
      : `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    return v.replace(/\/$/, '');
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  }

  // 4. Default to siteUrl or local
  return siteUrl || 'https://intersting.duckdns.org';
}

/**
 * Builds a direct, verified product URL for SMS messages.
 */
export function formatProductLink(
  siteUrl: string,
  item?: { product_id?: number; name?: string }
): string {
  if (!item) return `${siteUrl}/shop`;

  if (item.product_id && PRODUCT_SLUGS_BY_ID[item.product_id]) {
    return `${siteUrl}/product/${PRODUCT_SLUGS_BY_ID[item.product_id]}`;
  }
  if (item.product_id) {
    return `${siteUrl}/product/${item.product_id}`;
  }
  if (item.name) {
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `${siteUrl}/product/${slug}`;
  }
  return `${siteUrl}/shop`;
}

/**
 * Normalizes a phone number into international E.164 format.
 * E.g., "9876543210" -> "+919876543210" (assuming default IN code)
 * E.g., "09876543210" -> "+919876543210"
 * E.g., "+91 98765-43210" -> "+919876543210"
 */
export function normalizePhoneNumber(
  rawPhone: string,
  countryCode: string = process.env.DEFAULT_PHONE_COUNTRY_CODE || '+91'
): string | null {
  if (!rawPhone || typeof rawPhone !== 'string') return null;

  // Strip spaces, dashes, parentheses, dots
  let cleaned = rawPhone.trim().replace(/[\s\-().]/g, '');

  if (!cleaned) return null;

  // Clean country code prefix format (ensure it starts with +)
  const prefix = countryCode.startsWith('+') ? countryCode : `+${countryCode}`;

  if (cleaned.startsWith('+')) {
    // Already in international format
    return cleaned;
  }

  // Remove leading zeros (e.g. 09876543210 -> 9876543210)
  cleaned = cleaned.replace(/^0+/, '');

  // If already starts with prefix without plus (e.g. 919876543210 where prefix is +91)
  const numericPrefix = prefix.replace(/^\+/, '');
  if (cleaned.startsWith(numericPrefix) && cleaned.length > numericPrefix.length + 8) {
    return `+${cleaned}`;
  }

  // Default: prepend the country code prefix
  return `${prefix}${cleaned}`;
}

/**
 * Sends an SMS message using the httpSMS REST API.
 */
export async function sendHttpSms(options: SendSmsOptions): Promise<SmsResult> {
  const apiKey = process.env.HTTPSMS_API_KEY;
  const fromPhone = options.from || process.env.HTTPSMS_FROM_PHONE;
  const isEnabled = process.env.HTTPSMS_ENABLED !== 'false';

  if (!isEnabled) {
    console.log('[httpSMS] SMS dispatch skipped because HTTPSMS_ENABLED is false.');
    return { success: false, error: 'httpSMS is disabled via HTTPSMS_ENABLED flag.' };
  }

  if (!apiKey) {
    const error = '[httpSMS] HTTPSMS_API_KEY is not configured in environment variables.';
    console.warn(error);
    return { success: false, error };
  }

  if (!fromPhone) {
    const error = '[httpSMS] HTTPSMS_FROM_PHONE is not configured in environment variables.';
    console.warn(error);
    return { success: false, error };
  }

  const normalizedTo = normalizePhoneNumber(options.to);
  if (!normalizedTo) {
    const error = `[httpSMS] Invalid destination phone number: "${options.to}"`;
    console.warn(error);
    return { success: false, error };
  }

  const normalizedFrom = normalizePhoneNumber(fromPhone);
  if (!normalizedFrom) {
    const error = `[httpSMS] Invalid sender phone number in HTTPSMS_FROM_PHONE: "${fromPhone}"`;
    console.warn(error);
    return { success: false, error };
  }

  try {
    const response = await fetch('https://api.httpsms.com/v1/messages/send', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        content: options.content,
        from: normalizedFrom,
        to: normalizedTo,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || `HTTP ${response.status} ${response.statusText}`;
      console.error(`[httpSMS] Failed to send SMS to ${normalizedTo}:`, errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }

    console.log(`[httpSMS] SMS sent successfully to ${normalizedTo}. Message ID:`, data?.data?.id || 'OK');
    return {
      success: true,
      messageId: data?.data?.id,
      status: data?.data?.status || 'sent',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown network error';
    console.error(`[httpSMS] Network error sending SMS to ${normalizedTo}:`, errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Sends an automated order confirmation SMS to the customer, and optionally an alert to the store admin.
 */
export async function sendOrderConfirmationSms(order: WooOrder): Promise<{
  customerSms: SmsResult;
  adminSms?: SmsResult;
}> {
  const customerPhone = order.billing?.phone;
  const customerName = [order.billing?.first_name, order.billing?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Valued Customer';

  const orderId = order.id;
  const total = order.total || '0';
  const paymentTitle = order.payment_method_title || order.payment_method || 'Order';
  const items = order.line_items || [];
  const primaryItem = items[0];
  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const siteUrl = getStorefrontUrl();
  const trackingUrl = `${siteUrl}/account?order=${orderId}`;

  const status = (order.status || '').toLowerCase();
  const isPending = status.includes('pending');

  // Format exact product title & link
  let productInfoText = '';
  if (items.length === 1 && primaryItem) {
    const qtyText = (primaryItem.quantity || 1) > 1 ? ` (Qty: ${primaryItem.quantity})` : '';
    const pLink = formatProductLink(siteUrl, primaryItem);
    productInfoText = `\nItem: ${primaryItem.name}${qtyText}\nProduct Link: ${pLink}`;
  } else if (items.length > 1) {
    const itemNames = items.slice(0, 2).map((i) => `${i.name} (x${i.quantity || 1})`).join(', ');
    const moreCount = items.length - 2;
    const summary = moreCount > 0 ? `${itemNames} + ${moreCount} more` : itemNames;
    const pLink = primaryItem ? formatProductLink(siteUrl, primaryItem) : '';
    productInfoText = `\nItems (${items.length}): ${summary}${pLink ? `\nProduct Link: ${pLink}` : ''}`;
  }

  // Compose customer SMS with product link and live order tracking link
  const customerMessage = isPending
    ? `Hi ${customerName}, your order #${orderId} for Rs.${total} (${paymentTitle}) has been received.${productInfoText}\nTrack Order: ${trackingUrl}\nThank you for shopping with INTERSTING!`
    : `Hi ${customerName}, your order #${orderId} for Rs.${total} (${paymentTitle}) is confirmed!${productInfoText}\nTrack Order: ${trackingUrl}\nThank you for shopping with INTERSTING!`;

  let customerResult: SmsResult;

  if (customerPhone) {
    customerResult = await sendHttpSms({
      to: customerPhone,
      content: customerMessage,
    });
  } else {
    customerResult = {
      success: false,
      error: 'Order has no billing phone number provided.',
    };
    console.warn(`[httpSMS] Order #${orderId} has no billing phone number.`);
  }

  // Optional: Send alert to store admin if HTTPSMS_ADMIN_PHONE is set
  let adminResult: SmsResult | undefined = undefined;
  const adminPhone = process.env.HTTPSMS_ADMIN_PHONE;

  if (adminPhone) {
    const adminMessage =
      `New Order Alert! #${orderId} by ${customerName} for Rs.${total} (${paymentTitle}). ` +
      `${productInfoText ? productInfoText.trim() + ' ' : ''}Status: ${order.status || 'processing'}. Track: ${trackingUrl}`;

    adminResult = await sendHttpSms({
      to: adminPhone,
      content: adminMessage,
    });
  }

  return {
    customerSms: customerResult,
    adminSms: adminResult,
  };
}

/**
 * Statuses that should NOT trigger a status-update SMS to the customer.
 * E.g. 'pending', 'pending payment', 'on-hold' are intermediate states that confuse customers.
 */
const SILENT_STATUSES = new Set([
  'pending',
  'pending payment',
  'pending-payment',
  'on-hold',
  'checkout-draft',
  'auto-draft',
  'failed',
]);

/**
 * Sends an SMS update when an order status changes (e.g., to Completed / Delivered, Shipped, Processing, Cancelled).
 */
export async function sendOrderStatusUpdateSms(
  order: WooOrder,
  newStatus?: string
): Promise<{ customerSms: SmsResult; adminSms?: SmsResult }> {
  const customerPhone = order.billing?.phone;
  const customerName = [order.billing?.first_name, order.billing?.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Valued Customer';

  const orderId = order.id;
  const status = (newStatus || order.status || '').toLowerCase().trim();

  // 1. Skip SMS completely for pending, draft, or failed states to prevent confusing the customer
  if (SILENT_STATUSES.has(status) || status.includes('pending')) {
    console.log(`[httpSMS] Skipping customer status SMS for Order #${orderId} with status "${status}".`);
    return {
      customerSms: { success: true, status: 'skipped' },
    };
  }

  const siteUrl = getStorefrontUrl();
  const trackingUrl = `${siteUrl}/account?order=${orderId}`;

  const items = order.line_items || [];
  const primaryItem = items[0];
  let productInfoLine = '';
  if (items.length === 1 && primaryItem) {
    const pLink = formatProductLink(siteUrl, primaryItem);
    productInfoLine = `\nProduct: ${pLink}`;
  } else if (items.length > 1 && primaryItem) {
    const pLink = formatProductLink(siteUrl, primaryItem);
    productInfoLine = `\nProducts: ${pLink}`;
  }

  let customerMessage = '';
  if (status === 'completed') {
    customerMessage =
      `Hi ${customerName}, your order #${orderId} has been marked as Completed & Delivered!${productInfoLine}\n` +
      `Track / View Order: ${trackingUrl}\n` +
      `Thank you for shopping with INTERSTING!`;
  } else if (status === 'shipped') {
    customerMessage =
      `Hi ${customerName}, exciting news! Your order #${orderId} has been shipped and is on its way!${productInfoLine}\n` +
      `Track live delivery: ${trackingUrl}\n` +
      `Thank you for shopping with INTERSTING!`;
  } else if (status === 'processing') {
    customerMessage =
      `Hi ${customerName}, payment confirmed! Your order #${orderId} is now being processed and packed.${productInfoLine}\n` +
      `Track your order: ${trackingUrl}\n` +
      `Thank you for shopping with INTERSTING!`;
  } else if (status === 'cancelled') {
    customerMessage =
      `Hi ${customerName}, your order #${orderId} has been cancelled.\n` +
      `View order details or contact support: ${trackingUrl}`;
  } else if (status === 'refunded') {
    customerMessage =
      `Hi ${customerName}, a refund has been processed for your order #${orderId}.\n` +
      `View order details: ${trackingUrl}`;
  } else {
    // For other unmapped statuses, do not send confusing SMS to customer
    console.log(`[httpSMS] No customer SMS configured for status "${status}". Skipping.`);
    return {
      customerSms: { success: true, status: 'skipped' },
    };
  }

  let customerResult: SmsResult;
  if (customerPhone) {
    customerResult = await sendHttpSms({
      to: customerPhone,
      content: customerMessage,
    });
  } else {
    customerResult = {
      success: false,
      error: 'Order has no billing phone number.',
    };
  }

  let adminResult: SmsResult | undefined = undefined;
  const adminPhone = process.env.HTTPSMS_ADMIN_PHONE;
  if (adminPhone) {
    adminResult = await sendHttpSms({
      to: adminPhone,
      content: `Order #${orderId} status changed to ${status.toUpperCase()} for ${customerName}. View: ${trackingUrl}`,
    });
  }

  return { customerSms: customerResult, adminSms: adminResult };
}
