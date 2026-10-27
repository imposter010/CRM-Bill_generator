export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled';

export interface CompanySettings {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  state: string;
  bankName: string;
  branch: string;
  accountNo: string;
  ifscCode: string;
  terms: string;
  defaultCgstRate: number;
  defaultSgstRate: number;
  updatedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  gstin: string;
  phone: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
}

export interface InvoiceItem {
  id: string;
  sno: number;
  particulars: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  clientId?: string;
  clientName: string;
  clientAddress: string;
  clientGstin: string;
  clientPhone: string;
  paymentMethod: string;
  lrNo: string;
  vehicleNo: string;
  placeOfSupply: string;
  dateOfSupply: string;
  reverseCharge: 'Yes' | 'No';
  subtotal: number;
  cgstRate: number;
  sgstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  totalAmount: number;
  amountInWords: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export type ActiveScreen = 'dashboard' | 'invoices' | 'invoice-create' | 'invoice-edit' | 'invoice-view' | 'clients' | 'settings';
