import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { CompanySettings, Invoice } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

/**
 * Generate standard GST Tax Invoice HTML for print, preview, and PDF export
 */
export function generateInvoiceHtml(invoice: Invoice, company: CompanySettings): string {
  const itemsHtml = invoice.items
    .map(
      (item, idx) => `
    <tr>
      <td style="text-align: center; border: 1px solid #000; padding: 6px;">${idx + 1}</td>
      <td style="border: 1px solid #000; padding: 6px; font-weight: 500;">${escapeHtml(item.particulars)}</td>
      <td style="text-align: center; border: 1px solid #000; padding: 6px;">${escapeHtml(item.hsnCode || '-')}</td>
      <td style="text-align: center; border: 1px solid #000; padding: 6px;">${item.quantity}</td>
      <td style="text-align: right; border: 1px solid #000; padding: 6px;">${formatCurrency(item.rate)}</td>
      <td style="text-align: right; border: 1px solid #000; padding: 6px; font-weight: 600;">${formatCurrency(item.amount)}</td>
    </tr>`
    )
    .join('');

  // Blank filler rows if items are fewer than 4 for standard invoice appearance
  const fillerCount = Math.max(0, 4 - invoice.items.length);
  let fillerRows = '';
  for (let i = 0; i < fillerCount; i++) {
    fillerRows += `
    <tr>
      <td style="border: 1px solid #000; padding: 6px; height: 24px;"></td>
      <td style="border: 1px solid #000; padding: 6px;"></td>
      <td style="border: 1px solid #000; padding: 6px;"></td>
      <td style="border: 1px solid #000; padding: 6px;"></td>
      <td style="border: 1px solid #000; padding: 6px;"></td>
      <td style="border: 1px solid #000; padding: 6px;"></td>
    </tr>`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tax Invoice - ${escapeHtml(invoice.invoiceNo)}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 15mm;
    }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      color: #000000;
      background: #ffffff;
      font-size: 11pt;
      line-height: 1.3;
    }
    .invoice-box {
      border: 1.5px solid #000000;
      width: 100%;
      box-sizing: border-box;
      position: relative;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 1.5px solid #000;
    }
    .header-table td {
      padding: 10px 14px;
      vertical-align: top;
    }
    .company-title {
      font-size: 16pt;
      font-weight: 900;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    .company-sub {
      font-size: 9pt;
      color: #222;
      line-height: 1.4;
    }
    .title-banner {
      background: #f1f5f9;
      border-bottom: 1.5px solid #000;
      text-align: center;
      padding: 6px 0;
      font-size: 13pt;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 1.5px solid #000;
    }
    .info-table td {
      border-right: 1.5px solid #000;
      padding: 8px 12px;
      vertical-align: top;
      width: 50%;
      font-size: 9.5pt;
    }
    .info-table td:last-child {
      border-right: none;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 1.5px solid #000;
      font-size: 9.5pt;
    }
    .items-table th {
      background: #f1f5f9;
      border: 1px solid #000;
      padding: 6px;
      font-weight: 700;
      text-align: center;
    }
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      border-bottom: 1.5px solid #000;
      font-size: 9.5pt;
    }
    .totals-table td {
      padding: 6px 12px;
      vertical-align: top;
    }
    .words-box {
      border-bottom: 1.5px solid #000;
      padding: 8px 12px;
      font-size: 9.5pt;
      background: #f8fafc;
    }
    .footer-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
    }
    .footer-table td {
      border-right: 1.5px solid #000;
      padding: 8px 12px;
      vertical-align: top;
      width: 50%;
    }
    .footer-table td:last-child {
      border-right: none;
      text-align: right;
    }
    .sign-space {
      height: 50px;
    }
  </style>
</head>
<body>
  <div class="invoice-box">
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td style="width: 65%;">
          <div class="company-title">${escapeHtml(company.name)}</div>
          <div class="company-sub">
            ${escapeHtml(company.address)}<br>
            <strong>Phone:</strong> ${escapeHtml(company.phone)} &nbsp;|&nbsp; <strong>Email:</strong> ${escapeHtml(company.email)}<br>
            <strong>GSTIN:</strong> ${escapeHtml(company.gstin)}<br>
            <strong>State:</strong> ${escapeHtml(company.state)}
          </div>
        </td>
        <td style="width: 35%; text-align: right; vertical-align: middle;">
          <div style="font-size: 11pt; font-weight: 700; color: #1e293b;">ORIGINAL FOR RECIPIENT</div>
          <div style="font-size: 8.5pt; color: #64748b; margin-top: 4px;">GST Compliant Tax Invoice</div>
        </td>
      </tr>
    </table>

    <div class="title-banner">TAX INVOICE</div>

    <!-- Metadata & Client -->
    <table class="info-table">
      <tr>
        <td>
          <div style="font-weight: 700; margin-bottom: 6px; text-decoration: underline; text-transform: uppercase;">Details of Receiver (Billed To):</div>
          <div style="font-size: 11pt; font-weight: 700;">${escapeHtml(invoice.clientName)}</div>
          <div style="margin-top: 3px; line-height: 1.4;">
            ${escapeHtml(invoice.clientAddress).replace(/\n/g, '<br>')}<br>
            <strong>GSTIN:</strong> ${escapeHtml(invoice.clientGstin || 'Unregistered / None')}<br>
            <strong>Contact No:</strong> ${escapeHtml(invoice.clientPhone || '-')}<br>
            <strong>Place of Supply:</strong> ${escapeHtml(invoice.placeOfSupply || '-')}
          </div>
        </td>
        <td>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 2px 0; font-weight: 700; width: 45%;">Invoice No:</td>
              <td style="padding: 2px 0; font-weight: 800; font-family: monospace; font-size: 10.5pt;">${escapeHtml(invoice.invoiceNo)}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; font-weight: 700;">Invoice Date:</td>
              <td style="padding: 2px 0;">${formatDate(invoice.invoiceDate)}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; font-weight: 700;">Payment Mode:</td>
              <td style="padding: 2px 0;">${escapeHtml(invoice.paymentMethod || 'Bank Transfer')}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; font-weight: 700;">L.R. No:</td>
              <td style="padding: 2px 0;">${escapeHtml(invoice.lrNo || '-')}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; font-weight: 700;">Vehicle No:</td>
              <td style="padding: 2px 0;">${escapeHtml(invoice.vehicleNo || '-')}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; font-weight: 700;">Reverse Charge:</td>
              <td style="padding: 2px 0;">${invoice.reverseCharge || 'No'}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Line Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 6%;">S.No</th>
          <th style="width: 48%; text-align: left;">Description of Goods / Services</th>
          <th style="width: 14%;">HSN/SAC</th>
          <th style="width: 8%;">Qty</th>
          <th style="width: 12%; text-align: right;">Rate</th>
          <th style="width: 12%; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        ${fillerRows}
      </tbody>
    </table>

    <!-- Totals Table -->
    <table class="totals-table">
      <tr>
        <td style="width: 55%; border-right: 1.5px solid #000; vertical-align: top;">
          <strong>Bank Account Details for Payment:</strong><br>
          <strong>Bank Name:</strong> ${escapeHtml(company.bankName)}<br>
          <strong>Branch:</strong> ${escapeHtml(company.branch)}<br>
          <strong>Account No:</strong> <span style="font-family: monospace; font-weight: 700;">${escapeHtml(company.accountNo)}</span><br>
          <strong>IFSC Code:</strong> <span style="font-family: monospace; font-weight: 700;">${escapeHtml(company.ifscCode)}</span>
        </td>
        <td style="width: 45%;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 3px 0;">Subtotal:</td>
              <td style="padding: 3px 0; text-align: right; font-weight: 600;">${formatCurrency(invoice.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0;">CGST (${invoice.cgstRate}%):</td>
              <td style="padding: 3px 0; text-align: right;">${formatCurrency(invoice.cgstAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0;">SGST (${invoice.sgstRate}%):</td>
              <td style="padding: 3px 0; text-align: right;">${formatCurrency(invoice.sgstAmount)}</td>
            </tr>
            <tr style="border-top: 1.5px solid #000; font-size: 11pt;">
              <td style="padding: 5px 0; font-weight: 800;">Total Amount:</td>
              <td style="padding: 5px 0; text-align: right; font-weight: 900;">${formatCurrency(invoice.totalAmount)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Words Box -->
    <div class="words-box">
      <strong>Amount Chargeable (in words):</strong><br>
      <span style="font-weight: 600; font-style: italic;">${escapeHtml(invoice.amountInWords)}</span>
    </div>

    <!-- Footer: Terms & Signature -->
    <table class="footer-table">
      <tr>
        <td>
          <strong>Terms & Conditions:</strong>
          <div style="margin-top: 4px; font-size: 8pt; white-space: pre-line; color: #333;">
            ${escapeHtml(company.terms)}
          </div>
        </td>
        <td>
          <div style="font-weight: 700;">For ${escapeHtml(company.name)}</div>
          <div class="sign-space"></div>
          <div style="font-size: 8.5pt; border-top: 1px dashed #666; display: inline-block; padding-top: 4px;">Authorized Signatory</div>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
  `;
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Trigger print dialog
 */
export async function printInvoice(invoice: Invoice, company: CompanySettings): Promise<void> {
  const html = generateInvoiceHtml(invoice, company);
  if (Platform.OS === 'web') {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  } else {
    await Print.printAsync({ html });
  }
}

/**
 * Export invoice as PDF and open share sheet
 */
export async function shareInvoicePdf(invoice: Invoice, company: CompanySettings): Promise<void> {
  const html = generateInvoiceHtml(invoice, company);
  if (Platform.OS === 'web') {
    // On web, open print dialog which allows "Save as PDF"
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  } else {
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Share Invoice ${invoice.invoiceNo}`
      });
    }
  }
}
