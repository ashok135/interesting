import { NextRequest, NextResponse } from 'next/server';
import { sendHttpSms, normalizePhoneNumber, getStorefrontUrl, formatProductLink } from '@/lib/sms/httpsms';

export const dynamic = 'force-dynamic';

/**
 * Diagnostic endpoint for testing httpSMS configuration.
 *
 * GET /api/test-sms?phone=+91XXXXXXXXXX&msg=Hello
 * GET /api/test-sms?sample=order
 *
 * Checks:
 * - HTTPSMS_API_KEY presence
 * - HTTPSMS_FROM_PHONE presence
 * - Dispatches a test SMS to the requested phone number (or HTTPSMS_FROM_PHONE if none provided)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone') || process.env.HTTPSMS_ADMIN_PHONE || process.env.HTTPSMS_FROM_PHONE;
  const customMsg = searchParams.get('msg');
  const isOrderSample = searchParams.get('sample') === 'order';

  const apiKey = process.env.HTTPSMS_API_KEY;
  const fromPhone = process.env.HTTPSMS_FROM_PHONE;
  const adminPhone = process.env.HTTPSMS_ADMIN_PHONE;
  const enabled = process.env.HTTPSMS_ENABLED !== 'false';

  const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
  const requestOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : req.nextUrl.origin;
  const siteUrl = getStorefrontUrl(requestOrigin);

  const diagnostics = {
    configured: {
      hasApiKey: !!apiKey,
      apiKeyPreview: apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : 'MISSING',
      fromPhone: fromPhone || 'MISSING',
      adminPhone: adminPhone || 'NOT_SET (Optional)',
      smsEnabled: enabled,
      storefrontUrl: siteUrl,
    },
  };

  if (!phone) {
    return NextResponse.json({
      status: 'diagnostic_only',
      message: 'No test phone number provided. Pass ?phone=+91XXXXXXXXXX to send a test message.',
      diagnostics,
    });
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  let content = customMsg;
  if (!content) {
    if (isOrderSample) {
      const pLink = formatProductLink(siteUrl, {
        product_id: 48,
        name: 'Lightly Salted California Pistachios',
      });
      content = `Hi Valued Customer, your order #108 for Rs.499 (Online Payment) is confirmed!\nItem: Lightly Salted California Pistachios (Qty: 1)\nProduct Link: ${pLink}\nTrack Order: ${siteUrl}/account?order=108\nThank you for shopping with INTERSTING!`;
    } else {
      content = `[httpSMS Test] Connection verified successfully from your store at ${new Date().toLocaleTimeString()}!`;
    }
  }

  const result = await sendHttpSms({
    to: normalizedPhone || phone,
    content,
  });

  return NextResponse.json({
    status: result.success ? 'success' : 'failed',
    diagnostics,
    testDispatch: {
      recipient: normalizedPhone,
      content,
      result,
    },
  });
}
