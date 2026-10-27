import { Invoice } from '../types';

/**
 * Format currency to Indian Rupees (INR) format (e.g. ₹1,50,000.00)
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '' || Number.isNaN(Number(amount))) {
    return '₹0.00';
  }

  const num = Number(amount);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const [integerPart, decimalPart = '00'] = absNum.toFixed(2).split('.');

  if (integerPart.length <= 3) {
    return `${isNegative ? '-' : ''}₹${integerPart}.${decimalPart}`;
  }

  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  const formattedOthers = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');

  return `${isNegative ? '-' : ''}₹${formattedOthers},${lastThree}.${decimalPart}`;
}

/**
 * Format date to 'DD-MMM-YYYY' or readable string
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Generate next suggested invoice number (e.g. INV-0002)
 */
export function generateNextInvoiceNo(invoices: Invoice[]): string {
  let highestNum = 0;
  for (const inv of invoices) {
    const match = inv.invoiceNo.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num > highestNum) {
        highestNum = num;
      }
    }
  }
  const nextNum = highestNum + 1;
  return `INV-${String(nextNum).padStart(4, '0')}`;
}

/**
 * Get current date in YYYY-MM-DD
 */
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
