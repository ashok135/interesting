import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { updateCustomer, verifyCustomerCredentials } from '@/lib/api/customers';
import { checkRateLimit } from '@/lib/security/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const rl = checkRateLimit(req, { limit: 5, windowMs: 60 * 1000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many password update attempts. Please wait a minute.' },
        { status: 429, headers: { 'Retry-After': String(rl.resetSec) } }
      );
    }

    const user = await getCurrentUser(req);
    if (!user || !user.id || Number(user.id) <= 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (user.provider === 'email') {
      if (!currentPassword || typeof currentPassword !== 'string') {
        return NextResponse.json(
          { error: 'Please enter your current password to confirm this change.' },
          { status: 400 }
        );
      }
      const verified = await verifyCustomerCredentials(user.email, currentPassword);
      if (!verified) {
        return NextResponse.json(
          { error: 'Current password is incorrect.' },
          { status: 401 }
        );
      }
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match. Please re-enter.' },
        { status: 400 }
      );
    }

    // Update customer password in WooCommerce
    await updateCustomer(Number(user.id), {
      password: newPassword,
    });

    return NextResponse.json({
      success: true,
      message: 'Your password has been updated securely.',
    });
  } catch (error: unknown) {
    console.error('Update password error:', error);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
