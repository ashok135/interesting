import { NextRequest, NextResponse } from 'next/server';
import { sendHttpSms, normalizePhoneNumber } from '@/lib/sms/httpsms';

export const dynamic = 'force-dynamic';

/**
 * Diagnostic endpoint for testing httpSMS configuration.
 *
 * GET /api/test-sms?phone=+91XXXXXXXXXX&msg=Hello
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

  const apiKey = process.env.HTTPSMS_API_KEY;
  const fromPhone = process.env.HTTPSMS_FROM_PHONE;
  const adminPhone = process.env.HTTPSMS_ADMIN_PHONE;
  const enabled = process.env.HTTPSMS_ENABLED !== 'false';

  const diagnostics = {
    configured: {
      hasApiKey: !!apiKey,
      apiKeyPreview: apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : 'MISSING',
      fromPhone: fromPhone || 'MISSING',
      adminPhone: adminPhone || 'NOT_SET (Optional)',
      smsEnabled: enabled,
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
  const content = customMsg || `[httpSMS Test] Connection verified successfully from your store at ${new Date().toLocaleTimeString()}!`;

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
