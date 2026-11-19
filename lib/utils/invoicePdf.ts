import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { InvoiceData } from './invoice';

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

function truncateText(text: string, maxLen: number): string {
  if (!text) return '';
  return text.length > maxLen ? text.slice(0, maxLen - 1) + '…' : text;
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  // Standard A4: 595.28 x 841.89 points
  const page = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Brand colors
  const primaryGreen = rgb(13 / 255, 56 / 255, 33 / 255); // #0d3821
  const goldAccent = rgb(217 / 255, 119 / 255, 6 / 255); // #d97706
  const textDark = rgb(15 / 255, 23 / 255, 42 / 255); // #0f172a
  const textMuted = rgb(100 / 255, 116 / 255, 139 / 255); // #64748b
  const bgLight = rgb(248 / 255, 250 / 255, 252 / 255); // #f8fafc
  const borderColor = rgb(226 / 255, 232 / 255, 240 / 255); // #e2e8f0
  const white = rgb(1, 1, 1);
  const successGreen = rgb(22 / 255, 163 / 255, 74 / 255); // #16a34a

  const margin = 40;
  const contentWidth = width - margin * 2; // 515.28 pt

  let currentY = height - margin;

  // 1. Top Header Banner
  const headerHeight = 65;
  page.drawRectangle({
    x: margin,
    y: currentY - headerHeight,
    width: contentWidth,
    height: headerHeight,
    color: primaryGreen,
  });

  // Logo / Brand name
  page.drawText('INTERSTING', {
    x: margin + 16,
    y: currentY - 28,
    size: 20,
    font: fontBold,
    color: white,
  });
  page.drawText('GOURMET DRY FRUITS & ARTISANAL PANTRY', {
    x: margin + 16,
    y: currentY - 44,
    size: 8,
    font: fontBold,
    color: goldAccent,
  });

  // Invoice Title on Right
  page.drawText('TAX INVOICE', {
    x: width - margin - 140,
    y: currentY - 26,
    size: 16,
    font: fontBold,
    color: white,
  });
  page.drawText('ORIGINAL FOR RECIPIENT', {
    x: width - margin - 140,
    y: currentY - 42,
    size: 8,
    font: fontRegular,
    color: rgb(203 / 255, 213 / 255, 225 / 255),
  });

  currentY -= headerHeight + 12;

  // 2. Metadata Info Bar (Light Grey Box)
  const metaHeight = 36;
  page.drawRectangle({
    x: margin,
    y: currentY - metaHeight,
    width: contentWidth,
    height: metaHeight,
    color: bgLight,
    borderColor: borderColor,
    borderWidth: 1,
  });

  const formattedDate = data.dateCreated
    ? new Date(data.dateCreated).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN');

  page.drawText(`Invoice No: INV-INTERSTING-${data.orderId}`, {
    x: margin + 12,
    y: currentY - 22,
    size: 10,
    font: fontBold,
    color: textDark,
  });

  page.drawText(`Date: ${formattedDate}`, {
    x: margin + 200,
    y: currentY - 22,
    size: 10,
    font: fontRegular,
    color: textDark,
  });

  const paymentStatus = data.isPaid ? 'PAID ONLINE' : 'PAY ON DELIVERY';
  const statusColor = data.isPaid ? successGreen : goldAccent;
  page.drawText(`Status: ${paymentStatus}`, {
    x: width - margin - 150,
    y: currentY - 22,
    size: 10,
    font: fontBold,
    color: statusColor,
  });

  currentY -= metaHeight + 16;

  // 3. Seller & Customer Addresses (Two Columns)
  const colWidth = (contentWidth - 20) / 2;

  // Seller Column
  page.drawRectangle({
    x: margin,
    y: currentY - 110,
    width: colWidth,
    height: 110,
    color: white,
    borderColor: borderColor,
    borderWidth: 1,
  });

  page.drawText('SOLD BY (SUPPLIER)', {
    x: margin + 12,
    y: currentY - 18,
    size: 9,
    font: fontBold,
    color: primaryGreen,
  });
  page.drawText('INTERSTING GOURMET PANTRY', {
    x: margin + 12,
    y: currentY - 32,
    size: 10,
    font: fontBold,
    color: textDark,
  });
  page.drawText('Plot No. 14, 2nd Avenue, Anna Nagar', {
    x: margin + 12,
    y: currentY - 46,
    size: 9,
    font: fontRegular,
    color: textMuted,
  });
  page.drawText('Chennai, Tamil Nadu - 600040, India', {
    x: margin + 12,
    y: currentY - 58,
    size: 9,
    font: fontRegular,
    color: textMuted,
  });
  page.drawText('GSTIN: 33ABCDE1234F1Z5', {
    x: margin + 12,
    y: currentY - 74,
    size: 9,
    font: fontRegular,
    color: textDark,
  });
  page.drawText('FSSAI Lic. No: 12424008000412', {
    x: margin + 12,
    y: currentY - 86,
    size: 9,
    font: fontRegular,
    color: textDark,
  });
  page.drawText('Helpline: +91 99948 47167 | support@intersting.duckdns.org', {
    x: margin + 12,
    y: currentY - 98,
    size: 8,
    font: fontRegular,
    color: textMuted,
  });

  // Buyer Column
  const buyerX = margin + colWidth + 20;
  page.drawRectangle({
    x: buyerX,
    y: currentY - 110,
    width: colWidth,
    height: 110,
    color: white,
    borderColor: borderColor,
    borderWidth: 1,
  });

  page.drawText('BILLED & SHIPPED TO', {
    x: buyerX + 12,
    y: currentY - 18,
    size: 9,
    font: fontBold,
    color: primaryGreen,
  });
  page.drawText(truncateText(data.customerName || 'Customer', 35), {
    x: buyerX + 12,
    y: currentY - 32,
    size: 10,
    font: fontBold,
    color: textDark,
  });

  const fullAddr = [data.address1, data.address2].filter(Boolean).join(', ');
  page.drawText(truncateText(fullAddr || 'Standard Delivery Address', 40), {
    x: buyerX + 12,
    y: currentY - 46,
    size: 9,
    font: fontRegular,
    color: textMuted,
  });

  const cityState = [data.city, data.state, data.postcode].filter(Boolean).join(', ');
  page.drawText(truncateText(cityState || 'Tamil Nadu', 40), {
    x: buyerX + 12,
    y: currentY - 58,
    size: 9,
    font: fontRegular,
    color: textMuted,
  });

  if (data.phone) {
    page.drawText(`Phone: ${data.phone}`, {
      x: buyerX + 12,
      y: currentY - 74,
      size: 9,
      font: fontRegular,
      color: textDark,
    });
  }

  page.drawText(`Payment Mode: ${truncateText(data.paymentMethodTitle || 'UPI / Card', 28)}`, {
    x: buyerX + 12,
    y: currentY - 88,
    size: 9,
    font: fontRegular,
    color: textDark,
  });

  currentY -= 110 + 16;

  // 4. Products Items Table
  const tableHeaderHeight = 24;
  page.drawRectangle({
    x: margin,
    y: currentY - tableHeaderHeight,
    width: contentWidth,
    height: tableHeaderHeight,
    color: bgLight,
    borderColor: borderColor,
    borderWidth: 1,
  });

  // Table Column Positions
  const cNum = margin + 10;
  const cDesc = margin + 35;
  const cHSN = margin + 270;
  const cQty = margin + 340;
  const cPrice = margin + 395;
  const cTotal = margin + 460;

  page.drawText('#', { x: cNum, y: currentY - 16, size: 9, font: fontBold, color: textDark });
  page.drawText('Item Description', { x: cDesc, y: currentY - 16, size: 9, font: fontBold, color: textDark });
  page.drawText('HSN Code', { x: cHSN, y: currentY - 16, size: 9, font: fontBold, color: textDark });
  page.drawText('Qty', { x: cQty, y: currentY - 16, size: 9, font: fontBold, color: textDark });
  page.drawText('Price (Rs.)', { x: cPrice, y: currentY - 16, size: 9, font: fontBold, color: textDark });
  page.drawText('Total (Rs.)', { x: cTotal, y: currentY - 16, size: 9, font: fontBold, color: textDark });

  currentY -= tableHeaderHeight;

  // Table Rows
  const rowHeight = 22;
  const items = data.items || [];
  items.slice(0, 10).forEach((item, idx) => {
    const isEven = idx % 2 === 0;
    if (isEven) {
      page.drawRectangle({
        x: margin,
        y: currentY - rowHeight,
        width: contentWidth,
        height: rowHeight,
        color: rgb(253 / 255, 253 / 255, 254 / 255),
      });
    }

    page.drawLine({
      start: { x: margin, y: currentY - rowHeight },
      end: { x: width - margin, y: currentY - rowHeight },
      thickness: 0.5,
      color: borderColor,
    });

    const cleanItemName = (item.name || '').replace(/&amp;/g, '&');
    const unitPrice = typeof item.price === 'number' ? item.price : parseFloat(String(item.price || '0'));
    const totalAmount = typeof item.total === 'number' ? item.total : parseFloat(String(item.total || '0'));

    page.drawText(String(idx + 1), { x: cNum, y: currentY - 15, size: 9, font: fontRegular, color: textMuted });
    page.drawText(truncateText(cleanItemName, 42), { x: cDesc, y: currentY - 15, size: 9, font: fontRegular, color: textDark });
    page.drawText('0802', { x: cHSN, y: currentY - 15, size: 9, font: fontRegular, color: textMuted });
    page.drawText(String(item.quantity), { x: cQty + 6, y: currentY - 15, size: 9, font: fontRegular, color: textDark });
    page.drawText(unitPrice.toFixed(2), { x: cPrice, y: currentY - 15, size: 9, font: fontRegular, color: textDark });
    page.drawText(totalAmount.toFixed(2), { x: cTotal, y: currentY - 15, size: 9, font: fontBold, color: textDark });

    currentY -= rowHeight;
  });

  currentY -= 12;

  // 5. Totals & Calculations (Right Box)
  const totalsBoxWidth = 220;
  const totalsX = width - margin - totalsBoxWidth;
  const totalsBoxHeight = 84;

  page.drawRectangle({
    x: totalsX,
    y: currentY - totalsBoxHeight,
    width: totalsBoxWidth,
    height: totalsBoxHeight,
    color: bgLight,
    borderColor: borderColor,
    borderWidth: 1,
  });

  const drawSummaryLine = (label: string, value: string, yOffset: number, isBold = false, valColor = textDark) => {
    page.drawText(label, {
      x: totalsX + 12,
      y: currentY - yOffset,
      size: 9,
      font: isBold ? fontBold : fontRegular,
      color: isBold ? textDark : textMuted,
    });
    page.drawText(value, {
      x: width - margin - 12 - fontBold.widthOfTextAtSize(value, isBold ? 11 : 9),
      y: currentY - yOffset,
      size: isBold ? 11 : 9,
      font: isBold ? fontBold : fontRegular,
      color: valColor,
    });
  };

  drawSummaryLine('Items Subtotal:', `Rs. ${data.subtotal.toFixed(2)}`, 18);
  drawSummaryLine('Delivery Charges:', data.deliveryFee > 0 ? `Rs. ${data.deliveryFee.toFixed(2)}` : 'FREE', 34);

  if (data.discount > 0) {
    drawSummaryLine('Discount / Coupon:', `- Rs. ${data.discount.toFixed(2)}`, 50, false, rgb(220 / 255, 38 / 255, 38 / 255));
  } else {
    drawSummaryLine('Taxes (GST Included):', 'Included', 50);
  }

  // Divider inside totals box
  page.drawLine({
    start: { x: totalsX + 8, y: currentY - 60 },
    end: { x: width - margin - 8, y: currentY - 60 },
    thickness: 1,
    color: primaryGreen,
  });

  drawSummaryLine('Grand Total:', `Rs. ${data.grandTotal.toFixed(2)}`, 74, true, primaryGreen);

  // 6. Amount In Words Box (Left Side)
  const wordsBoxWidth = totalsX - margin - 16;
  page.drawRectangle({
    x: margin,
    y: currentY - totalsBoxHeight,
    width: wordsBoxWidth,
    height: totalsBoxHeight,
    color: white,
    borderColor: borderColor,
    borderWidth: 1,
  });

  page.drawText('AMOUNT IN WORDS:', {
    x: margin + 12,
    y: currentY - 20,
    size: 8,
    font: fontBold,
    color: textMuted,
  });

  const words = numberToWords(data.grandTotal);
  page.drawText(truncateText(words, 48), {
    x: margin + 12,
    y: currentY - 38,
    size: 10,
    font: fontBold,
    color: textDark,
  });

  page.drawText('Applicable GST (5% / 12%) is fully included in the total prices.', {
    x: margin + 12,
    y: currentY - 58,
    size: 8,
    font: fontRegular,
    color: textMuted,
  });

  currentY -= totalsBoxHeight + 24;

  // 7. Footer Terms & Digital Signatory
  page.drawLine({
    start: { x: margin, y: currentY },
    end: { x: width - margin, y: currentY },
    thickness: 0.5,
    color: borderColor,
  });

  currentY -= 14;

  page.drawText('Terms & Conditions:', {
    x: margin,
    y: currentY,
    size: 8,
    font: fontBold,
    color: textDark,
  });
  page.drawText('1. 7-Day Replacement Guarantee: Report damaged or broken seals for prompt doorstep replacement.', {
    x: margin,
    y: currentY - 12,
    size: 8,
    font: fontRegular,
    color: textMuted,
  });
  page.drawText('2. Keep farm-fresh dry fruits stored in airtight canisters away from direct sunlight.', {
    x: margin,
    y: currentY - 24,
    size: 8,
    font: fontRegular,
    color: textMuted,
  });
  page.drawText('3. This is a digitally signed computer-generated Tax Invoice. No physical signature is required.', {
    x: margin,
    y: currentY - 36,
    size: 8,
    font: fontRegular,
    color: textMuted,
  });

  // Signatory Box on Right
  page.drawText('For INTERSTING PANTRY', {
    x: width - margin - 150,
    y: currentY,
    size: 9,
    font: fontBold,
    color: primaryGreen,
  });

  page.drawRectangle({
    x: width - margin - 150,
    y: currentY - 34,
    width: 140,
    height: 22,
    color: rgb(240 / 255, 253 / 255, 244 / 255),
    borderColor: successGreen,
    borderWidth: 1,
  });

  page.drawText('Authorized Digital Signatory', {
    x: width - margin - 142,
    y: currentY - 26,
    size: 8,
    font: fontBold,
    color: successGreen,
  });

  return await doc.save();
}
