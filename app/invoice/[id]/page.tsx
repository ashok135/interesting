import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { wcFetch } from '@/lib/api/client';
import type { WooOrder } from '@/types';
import { buildInvoiceDataFromWooOrder, generateInvoiceHtml } from '@/lib/utils/invoice';

interface InvoicePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: InvoicePageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Tax Invoice #INV-${id} | INTERSTING`,
    description: `Official Tax Invoice for Order #${id} from INTERSTING Gourmet Pantry.`,
    robots: { index: false, follow: false },
  };
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params;

  let order: WooOrder | null = null;
  try {
    order = await wcFetch<WooOrder>(`orders/${id}`, { cache: 'no-store' });
  } catch (err) {
    console.error(`[Invoice] Error fetching order #${id}:`, err);
  }

  if (!order || !order.id) {
    return notFound();
  }

  const invoiceData = buildInvoiceDataFromWooOrder(order);
  const invoiceHtml = generateInvoiceHtml(invoiceData);

  return (
    <div
      dangerouslySetInnerHTML={{ __html: invoiceHtml }}
      style={{ minHeight: '100vh', background: '#f8fafc' }}
    />
  );
}
