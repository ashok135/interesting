import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, createSessionToken } from '@/lib/auth/session';
import { updateCustomer, findCustomerByEmail } from '@/lib/api/customers';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const trimmedName = name.trim();
    const nameParts = trimmedName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Update customer record in WooCommerce
    await updateCustomer(user.id, {
      first_name: firstName,
      last_name: lastName,
      billing: {
        first_name: firstName,
        last_name: lastName,
        phone: phone || '',
        company: '',
        address_1: '',
        address_2: '',
        city: '',
        state: '',
        postcode: '',
        country: 'IN',
        email: user.email,
      },
    });

    const updatedUser = {
      ...user,
      name: trimmedName,
    };

    // Refresh session cookie
    const token = createSessionToken(updatedUser);
    const res = NextResponse.json({ success: true, user: updatedUser });

    res.cookies.set('intersting_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
    });

    return res;
  } catch (error: unknown) {
    console.error('Update profile error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to update profile';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
