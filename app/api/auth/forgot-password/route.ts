import { NextRequest, NextResponse } from 'next/server';
import { findCustomerByEmail } from '@/lib/api/customers';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const trimmedEmail = email.toLowerCase().trim();
    const customer = await findCustomerByEmail(trimmedEmail);

    const wcUrl = process.env.NEXT_PUBLIC_WC_URL || 'http://interesting.local';
    const wpResetUrl = `${wcUrl}/wp-login.php?action=lostpassword&user_login=${encodeURIComponent(trimmedEmail)}`;

    if (!customer) {
      // Don't leak whether an email exists for security, but return friendly confirmation
      return NextResponse.json({
        success: true,
        message: 'If an account exists for this email, password reset instructions have been generated.',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset link ready. Click below to choose a new password.',
      resetUrl: wpResetUrl,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Failed to process password reset. Please try again.' }, { status: 500 });
  }
}
