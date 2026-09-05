import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { updateCustomer } from '@/lib/api/customers';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { newPassword, confirmPassword } = body;

    if (!newPassword || newPassword.length < 6) {
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

    // Directly update customer password in WooCommerce
    await updateCustomer(user.id, {
      password: newPassword,
    });

    return NextResponse.json({
      success: true,
      message: 'Your password has been updated securely.',
    });
  } catch (error: unknown) {
    console.error('Update password error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to update password';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
