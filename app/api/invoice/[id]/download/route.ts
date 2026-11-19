import { NextRequest, NextResponse } from 'next/server';
import { wcFetch } from '@/lib/api/client';
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
    if (!id) {
      return new NextResponse('Order ID is required', { status: 400 });
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
  } catch (error: any) {
    console.error('[Invoice Download] Failed to generate PDF invoice:', error);
    return new NextResponse('Failed to generate invoice', { status: 500 });
  }
}
