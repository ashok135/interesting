import type { WooOrder } from '@/types';
import { formatPrice } from './formatters';

export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number | string;
  total: number | string;
}

export interface InvoiceData {
  orderId: number | string;
  dateCreated?: string;
  customerName: string;
  email?: string;
  phone?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postcode: string;
  paymentMethodTitle: string;
  isPaid: boolean;
  items: InvoiceItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
}

function numberToWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const num = Math.floor(Math.max(0, amount));
  if (num === 0) return 'Zero Rupees Only';

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
  }

  return convert(num) + ' Rupees Only';
}

/**
 * Extracts normalized InvoiceData from a WooOrder object.
 */
export function buildInvoiceDataFromWooOrder(order: WooOrder): InvoiceData {
  const billing = order.billing || ({} as WooOrder['billing']);
  const shipping = order.shipping || billing;

  const customerName = [shipping.first_name || billing.first_name, shipping.last_name || billing.last_name]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Customer';

  const items: InvoiceItem[] = (order.line_items || []).map((it) => ({
    name: it.name,
    quantity: it.quantity || 1,
    price: it.price || (parseFloat(it.total || '0') / (it.quantity || 1)),
    total: parseFloat(it.total || '0'),
  }));

  const grandTotal = parseFloat(order.total || '0');
  const itemsSubtotal = items.reduce((acc, it) => acc + (typeof it.total === 'number' ? it.total : parseFloat(it.total)), 0);
  const deliveryFee = grandTotal >= 499 ? 0 : (grandTotal > itemsSubtotal ? grandTotal - itemsSubtotal : 0);
  const discount = Math.max(0, itemsSubtotal + deliveryFee - grandTotal);

  const status = (order.status || '').toLowerCase();
  const payMethod = (order.payment_method || '').toLowerCase();
  const isPaid = status === 'completed' || status === 'processing' || (!payMethod.includes('cod') && status !== 'cancelled');

  return {
    orderId: order.id,
    dateCreated: order.date_created,
    customerName,
    email: billing.email || '',
    phone: shipping.phone || billing.phone || '',
    address1: shipping.address_1 || billing.address_1 || '',
    address2: shipping.address_2 || billing.address_2 || '',
    city: shipping.city || billing.city || '',
    state: shipping.state || billing.state || '',
    postcode: shipping.postcode || billing.postcode || '',
    paymentMethodTitle: order.payment_method_title || (payMethod === 'cod' ? 'Pay on Delivery (Cash / UPI)' : 'Online Payment (Razorpay)'),
    isPaid,
    items,
    subtotal: itemsSubtotal || grandTotal,
    deliveryFee,
    discount,
    grandTotal,
  };
}

function escapeHtml(str: string | number | undefined | null): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates an elegant, print-ready HTML tax invoice string (with strict HTML escaping).
 */
export function generateInvoiceHtml(data: InvoiceData): string {
  const invoiceDate = data.dateCreated
    ? new Date(data.dateCreated).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  const addressLine = escapeHtml([data.address1, data.address2].filter(Boolean).join(', '));
  const locationLine = escapeHtml([data.city, data.state ? `${data.state} - ${data.postcode}` : data.postcode].filter(Boolean).join(', '));
  const safeOrderId = escapeHtml(data.orderId);
  const safeCustomerName = escapeHtml(data.customerName);
  const safePhone = escapeHtml(data.phone);
  const safeEmail = escapeHtml(data.email);
  const safePaymentTitle = escapeHtml(data.paymentMethodTitle);
  const safeState = escapeHtml(data.state || 'Tamil Nadu');
  const siteUrl = escapeHtml((process.env.NEXT_PUBLIC_SITE_URL || 'https://intersting.duckdns.org').replace(/\/$/, ''));

  const rowsHtml = data.items
    .map((item, idx) => {
      const unit = typeof item.price === 'number' ? item.price : parseFloat(item.price || '0');
      const tot = typeof item.total === 'number' ? item.total : parseFloat(item.total || '0');
      const safeItemName = escapeHtml(item.name);
      return `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 13px;">${idx + 1}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">
            <strong style="color: #0f172a; display: block;">${safeItemName}</strong>
            <span style="color: #64748b; font-size: 11px;">HSN: 0802 • Gourmet Grade</span>
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 13px;">${Number(item.quantity) || 1}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 13px;">₹${unit.toFixed(2)}</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">5% (Incl.)</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #0f172a; font-size: 13px;">₹${tot.toFixed(2)}</td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Invoice_Order_${safeOrderId}_INTERSTING</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      padding: 30px 16px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-wrapper {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      padding: 40px;
    }
    .badge-tax {
      display: inline-block;
      padding: 4px 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .badge-paid {
      display: inline-block;
      padding: 3px 10px;
      background: #dcfce7;
      color: #15803d;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-cod {
      display: inline-block;
      padding: 3px 10px;
      background: #fef3c7;
      color: #b45309;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th {
      background: #f8fafc;
      padding: 10px 12px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #475569;
      border-bottom: 2px solid #cbd5e1;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .invoice-wrapper {
        border: none;
        box-shadow: none;
        padding: 20px;
        max-width: 100%;
      }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

  <!-- Screen Actions Bar (hidden on print) -->
  <div class="no-print" style="max-width: 800px; margin: 0 auto 20px; display: flex; justify-content: space-between; align-items: center;">
    <button onclick="window.close()" style="background: #ffffff; border: 1.5px solid #cbd5e1; color: #475569; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px;">
      ← Close Window
    </button>
    <button onclick="window.print()" style="background: #0d3821; border: none; color: #ffffff; padding: 9px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 8px; box-shadow: 0 2px 8px rgba(13,56,33,0.25);">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
      Print / Download PDF Invoice
    </button>
  </div>

  <div class="invoice-wrapper">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0;">
      <div>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
          <h1 style="font-size: 24px; font-weight: 800; color: #0d3821; letter-spacing: 0.05em;">INTERSTING</h1>
          <span class="badge-tax">TAX INVOICE</span>
        </div>
        <p style="font-size: 12px; color: #64748b; font-weight: 500;">Direct Orchard Harvest • 100% Zero Adulteration King Grade Dry Fruits</p>
        <p style="font-size: 12px; color: #64748b; margin-top: 4px;">GST-Inclusive Tax Invoice</p>
        <p style="font-size: 12px; color: #64748b;">Support: support@intersting.duckdns.org | ${siteUrl}</p>
      </div>
      <div style="text-align: right;">
        <p style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase;">Invoice Number</p>
        <p style="font-size: 17px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">INV-2026-${safeOrderId}</p>
        <p style="font-size: 12px; color: #64748b;">Order Ref: <strong>#${safeOrderId}</strong></p>
        <p style="font-size: 12px; color: #64748b;">Date: <strong>${escapeHtml(invoiceDate)}</strong></p>
      </div>
    </div>

    <!-- Bill to & Ship to -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px 0; border-bottom: 1px solid #e2e8f0;">
      <div style="background: #f8fafc; padding: 14px 16px; border-radius: 8px; border: 1px solid #edf2f7;">
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Billed & Delivered To:</span>
        <h4 style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 4px 0;">${safeCustomerName}</h4>
        <p style="font-size: 12px; color: #475569; line-height: 1.45;">${addressLine}</p>
        <p style="font-size: 12px; color: #475569; line-height: 1.45;">${locationLine}</p>
        ${safePhone ? `<p style="font-size: 12px; color: #0f172a; margin-top: 4px;"><strong>Phone:</strong> ${safePhone}</p>` : ''}
        ${safeEmail ? `<p style="font-size: 12px; color: #64748b;"><strong>Email:</strong> ${safeEmail}</p>` : ''}
      </div>

      <div style="background: #f8fafc; padding: 14px 16px; border-radius: 8px; border: 1px solid #edf2f7;">
        <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Payment Details:</span>
        <p style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 4px 0;">${safePaymentTitle}</p>
        <div style="margin: 6px 0;">
          ${data.isPaid ? '<span class="badge-paid">✓ PAID</span>' : '<span class="badge-cod">⌛ PAY ON DELIVERY</span>'}
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 4px;">Place of Supply: <strong>${safeState}</strong></p>
        <p style="font-size: 12px; color: #64748b;">Dispatch: <strong>Air Express Courier (3-5 Days)</strong></p>
      </div>
    </div>

    <!-- Items Table -->
    <table>
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">#</th>
          <th style="text-align: left;">Product Description</th>
          <th style="width: 60px; text-align: center;">Qty</th>
          <th style="width: 100px; text-align: right;">Unit Price</th>
          <th style="width: 90px; text-align: center;">GST Rate</th>
          <th style="width: 110px; text-align: right;">Total Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <!-- Totals -->
    <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
      <div style="width: 320px;">
        <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #475569;">
          <span>Subtotal</span>
          <span>₹${data.subtotal.toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #475569;">
          <span>Delivery Charges</span>
          <span>${data.deliveryFee === 0 ? '<strong style="color: #16a34a;">FREE</strong>' : `₹${data.deliveryFee.toFixed(2)}`}</span>
        </div>
        ${
          data.discount > 0
            ? `<div style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #16a34a;">
                <span>Discount / Promo</span>
                <span>-₹${data.discount.toFixed(2)}</span>
              </div>`
            : ''
        }
        <div style="display: flex; justify-content: space-between; padding: 10px 0; font-size: 16px; font-weight: 800; color: #0d3821; border-top: 2px solid #0d3821; border-bottom: 2px solid #0d3821; margin-top: 6px;">
          <span>Total Amount</span>
          <span>₹${data.grandTotal.toFixed(2)}</span>
        </div>
        <p style="font-size: 11px; color: #64748b; margin-top: 6px; text-align: right; font-style: italic;">
          (Includes ₹${((data.grandTotal * 5) / 105).toFixed(2)} CGST + SGST @ 5%)
        </p>
      </div>
    </div>

    <!-- Amount in words -->
    <div style="background: #f8fafc; border-left: 3px solid #0d3821; padding: 10px 14px; margin-top: 24px; border-radius: 4px;">
      <span style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Amount in Words:</span>
      <p style="font-size: 13px; font-weight: 700; color: #0f172a;">${numberToWords(data.grandTotal)}</p>
    </div>

    <!-- Footer Terms & Signatory -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 36px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
      <div style="font-size: 11px; color: #64748b; max-width: 480px; line-height: 1.5;">
        <strong style="color: #475569;">Terms &amp; Conditions:</strong>
        <p>1. 7-Day Replacement Guarantee: Report damaged or seal-broken packs within 7 days for immediate replacement.</p>
        <p>2. Keep dry fruits stored in airtight containers away from direct sunlight.</p>
        <p>3. This is an electronically generated Tax Invoice; no physical signature is required.</p>
      </div>
      <div style="text-align: right;">
        <p style="font-size: 12px; font-weight: 700; color: #0d3821;">For INTERSTING PANTRY</p>
        <div style="height: 38px; display: flex; align-items: center; justify-content: flex-end;">
          <span style="font-size: 11px; color: #16a34a; font-weight: 700; border: 1px dashed #16a34a; padding: 2px 8px; border-radius: 4px;">Authorized Digital Signatory</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers a direct download of the PDF invoice in the client's browser.
 */
export function printOrDownloadInvoice(data: InvoiceData): void {
  if (typeof window === 'undefined') return;
  const downloadUrl = `/api/invoice/${data.orderId}/download`;
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', `Invoice-INTERSTING-${data.orderId}.pdf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
