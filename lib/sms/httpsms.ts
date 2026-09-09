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
  const itemCount = (order.line_items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  ).replace(/\/$/, '');

  const trackingUrl = `${siteUrl}/track?id=${orderId}`;

  // Compose customer SMS with tracking link
  const customerMessage =
    `Hi ${customerName}, your order #${orderId} for Rs.${total} (${paymentTitle}) has been confirmed! ` +
    `Track your order: ${trackingUrl} . ` +
    `Thank you for shopping with Interesting!`;

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
      `Items: ${itemCount}. Status: ${order.status || 'processing'}. Track: ${trackingUrl}`;

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
