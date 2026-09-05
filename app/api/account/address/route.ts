import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { updateCustomer, findCustomerByEmail } from '@/lib/api/customers';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      firstName,
      lastName,
      address1,
      address2,
      city,
      state,
      postcode,
      country = 'IN',
      phone,
    } = body;

    if (!address1 || !city || !state || !postcode) {
      return NextResponse.json(
        { error: 'Please provide full address, city, state, and PIN code.' },
        { status: 400 }
      );
    }

    const addressData = {
      first_name: firstName || user.name.split(' ')[0] || '',
      last_name: lastName || user.name.split(' ').slice(1).join(' ') || '',
      company: '',
      address_1: address1.trim(),
      address_2: (address2 || '').trim(),
      city: city.trim(),
      state: state.trim(),
      postcode: postcode.trim(),
      country: country || 'IN',
      phone: (phone || '').trim(),
    };

    // Update customer in WooCommerce
    const updatedCustomer = await updateCustomer(user.id, {
      shipping: addressData,
      billing: {
        ...addressData,
        email: user.email,
      },
    });

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
    });
  } catch (error: unknown) {
    console.error('Update address error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to update address';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
