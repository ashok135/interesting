import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { wcFetch } from '@/lib/api/client';
import { getCurrentUser, verifyOrderAccessToken } from '@/lib/auth/session';
import type { WooOrder } from '@/types';
import { buildInvoiceDataFromWooOrder, generateInvoiceHtml } from '@/lib/utils/invoice';

interface InvoicePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({ params }: InvoicePageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Tax Invoice #INV-${id} | INTERSTING`,
    description: `Official Tax Invoice for Order #${id} from INTERSTING Gourmet Pantry.`,
    robots: { index: false, follow: false },
  };
}

export default async function InvoicePage({ params, searchParams }: InvoicePageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!id || !/^\d+$/.test(id)) {
    return notFound();
  }

  const orderIdNum = Number(id);
  const sessionUser = await getCurrentUser();
  const hasValidToken = Boolean(token && verifyOrderAccessToken(token, orderIdNum));

  if (!sessionUser && !hasValidToken) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Sign in required</h1>
        <p style={{ color: '#64748b', marginBottom: '1.25rem' }}>Please sign in to your account to view and download this tax invoice.</p>
        <Link href="/login" style={{ padding: '0.7rem 1.4rem', background: '#0d3821', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
          Sign In
        </Link>
      </div>
    );
  }

  let order: WooOrder | null = null;
  try {
    order = await wcFetch<WooOrder>(`orders/${id}`, { cache: 'no-store' });
  } catch (err) {
    console.error(`[Invoice] Error fetching order #${id}:`, err);
  }

  if (!order || !order.id) {
    return notFound();
  }

  if (!hasValidToken) {
    const orderCustomerId = order.customer_id ? Number(order.customer_id) : null;
    const sessionUserId = sessionUser?.id ? Number(sessionUser.id) : null;
    const orderEmail = order.billing?.email?.toLowerCase().trim();
    const sessionEmail = sessionUser?.email?.toLowerCase().trim();

    const isOwner =
      Boolean(orderCustomerId && sessionUserId && orderCustomerId === sessionUserId) ||
      Boolean(orderEmail && sessionEmail && orderEmail === sessionEmail);

    if (!isOwner) {
      return notFound();
    }
  }

  const invoiceData = buildInvoiceDataFromWooOrder(order);
  const invoiceHtml = generateInvoiceHtml(invoiceData);
  const downloadHref = token
    ? `/api/invoice/${id}/download?token=${encodeURIComponent(token)}`
    : `/api/invoice/${id}/download`;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', paddingBottom: '40px' }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontWeight: 700, color: '#0d3821', fontSize: '15px' }}>INTERSTING</span>
          <span style={{ color: '#94a3b8' }}>|</span>
          <span style={{ fontSize: '13px', color: '#475569' }}>Invoice #INV-{id}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a
            href={downloadHref}
            download={`Invoice-INTERSTING-${id}.pdf`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: '#0d3821',
              color: '#ffffff',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(13,56,33,0.15)',
            }}
          >
            ⬇️ Download PDF
          </a>
        </div>
      </div>
      <div dangerouslySetInnerHTML={{ __html: invoiceHtml }} />
    </div>
  );
}
