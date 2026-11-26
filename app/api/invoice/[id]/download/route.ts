import { NextRequest, NextResponse } from 'next/server';
import { wcFetch } from '@/lib/api/client';
import { getCurrentUser, verifyOrderAccessToken } from '@/lib/auth/session';
import type { WooOrder } from '@/types';
import { buildInvoiceDataFromWooOrder } from '@/lib/utils/invoice';
import { generateInvoicePdf } from '@/lib/utils/invoicePdf';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id || !/^\d+$/.test(id)) {
      return new NextResponse('Valid numeric Order ID is required', { status: 400 });
    }

    const orderIdNum = Number(id);
    const sessionUser = await getCurrentUser(req);
    const token = req.nextUrl.searchParams.get('token') || '';
    const hasValidToken = Boolean(token && verifyOrderAccessToken(token, orderIdNum));

    if (!sessionUser && !hasValidToken) {
      return new NextResponse('Unauthorized: Please sign in or use your order confirmation link.', { status: 401 });
    }

    let order: WooOrder | null = null;
    try {
      order = await wcFetch<WooOrder>(`orders/${id}`, { cache: 'no-store' });
    } catch (err) {
      console.error(`[Invoice Download] Error fetching order #${id}:`, err);
    }

    if (!order || !order.id) {
      return new NextResponse('Order not found', { status: 404 });
    }

    // Strict IDOR protection: verify order ownership unless valid signed order token is provided
    if (!hasValidToken) {
      const orderCustomerId = order.customer_id ? Number(order.customer_id) : null;
      const sessionUserId = sessionUser?.id ? Number(sessionUser.id) : null;
      const orderEmail = order.billing?.email?.toLowerCase().trim();
      const sessionEmail = sessionUser?.email?.toLowerCase().trim();

      const isOwner =
        Boolean(orderCustomerId && sessionUserId && orderCustomerId === sessionUserId) ||
        Boolean(orderEmail && sessionEmail && orderEmail === sessionEmail);

      if (!isOwner) {
        return new NextResponse('Forbidden: You do not have permission to download this invoice.', { status: 403 });
      }
    }

    const invoiceData = buildInvoiceDataFromWooOrder(order);
    const pdfBytes = await generateInvoicePdf(invoiceData);

    const filename = `Invoice-INTERSTING-${id}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBytes.length),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('[Invoice Download] Failed to generate PDF invoice:', error);
    return new NextResponse('Failed to generate invoice', { status: 500 });
  }
}
