import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client, CompanySettings, Invoice, InvoiceStatus } from '../types';
import {
  deleteRemoteClient,
  deleteRemoteInvoice,
  fetchRemoteClients,
  fetchRemoteInvoices,
  fetchRemoteSettings,
  saveRemoteClient,
  saveRemoteInvoice,
  saveRemoteSettings,
  updateRemoteInvoiceStatus
} from './api';

const STORAGE_KEYS = {
  SETTINGS: '@crm_company_settings',
  CLIENTS: '@crm_clients',
  INVOICES: '@crm_invoices',
  INITIALIZED: '@crm_is_initialized'
};

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  id: 'company-default',
  name: 'NA NATURAL AIR CONDITION',
  address: '39/2 Narsingh Bazar Indore',
  phone: '9111303654',
  email: 'arshanahma@gmail.com',
  gstin: '23AORPA7441L1ZR',
  state: 'STATE 23 Madhya Pradesh',
  bankName: 'UCO BANK',
  branch: 'BALVINAYMANDER INDORE',
  accountNo: '19950110059142',
  ifscCode: 'UCBA0001995',
  terms:
    'Terms & conditions :\n1. If the payment is not made within 15 days.\n2. Subject to INDORE Jurisdiction.\n3. E. & O.E.',
  defaultCgstRate: 9,
  defaultSgstRate: 9
};

const DEFAULT_CLIENTS: Client[] = [
  {
    id: 'client-1',
    name: 'Google DeepMind India',
    address: 'Bandra Kurla Complex, Mumbai, MH - 400051',
    gstin: '27AADCG1234F1Z5',
    phone: '9111303654',
    email: 'billing@deepmind.google',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNo: 'INV-0001',
    invoiceDate: '2026-07-03',
    clientId: 'client-1',
    clientName: 'Google DeepMind India',
    clientAddress: 'Bandra Kurla Complex, Mumbai, MH - 400051',
    clientGstin: '27AADCG1234F1Z5',
    clientPhone: '9111303654',
    paymentMethod: 'Bank Transfer',
    lrNo: '',
    vehicleNo: '',
    placeOfSupply: 'Mumbai',
    dateOfSupply: '2026-07-03',
    reverseCharge: 'No',
    subtotal: 1860.0,
    cgstRate: 9.0,
    sgstRate: 9.0,
    cgstAmount: 167.4,
    sgstAmount: 167.4,
    totalAmount: 2194.8,
    amountInWords: 'Two Thousand One Hundred and Ninety Four Rupees and Eighty Paise Only',
    status: 'paid',
    items: [
      {
        id: 'item-1',
        sno: 1,
        particulars: 'AC Maintenance & Gas Refill Services',
        hsnCode: '998719',
        quantity: 1,
        rate: 1860.0,
        amount: 1860.0
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

/**
 * Initialize storage with default data if empty
 */
export async function initializeStorage(): Promise<void> {
  try {
    const initialized = await AsyncStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_COMPANY_SETTINGS));
      await AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(DEFAULT_CLIENTS));
      await AsyncStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(DEFAULT_INVOICES));
      await AsyncStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

/**
 * Get company settings (Remote MongoDB -> Local Cache Fallback)
 */
export async function getCompanySettings(): Promise<CompanySettings> {
  try {
    // Try remote MongoDB first
    const remote = await fetchRemoteSettings();
    if (remote) {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(remote));
      return remote;
    }
  } catch {}

  // Fallback to local cache
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (data) {
      return JSON.parse(data);
    }
    return DEFAULT_COMPANY_SETTINGS;
  } catch {
    return DEFAULT_COMPANY_SETTINGS;
  }
}

/**
 * Save company settings (Sync to both MongoDB and Local Cache)
 */
export async function saveCompanySettings(settings: CompanySettings): Promise<void> {
  const updated: CompanySettings = {
    ...settings,
    updatedAt: new Date().toISOString()
  };
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  saveRemoteSettings(updated).catch(() => {});
}

/**
 * Get all clients (Remote MongoDB -> Local Cache Fallback)
 */
export async function getClients(): Promise<Client[]> {
  try {
    const remote = await fetchRemoteClients();
    if (remote && remote.length > 0) {
      await AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(remote));
      return remote;
    }
  } catch {}

  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (data) {
      return JSON.parse(data);
    }
    return DEFAULT_CLIENTS;
  } catch {
    return [];
  }
}

/**
 * Save or update a client
 */
export async function saveClient(client: Client): Promise<void> {
  const clients = await getClients();
  const index = clients.findIndex(c => c.id === client.id);
  if (index >= 0) {
    clients[index] = { ...client, updatedAt: new Date().toISOString() };
  } else {
    clients.push({
      ...client,
      id: client.id || `client-${Date.now()}`,
      createdAt: client.createdAt || new Date().toISOString()
    });
  }
  await AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  saveRemoteClient(client).catch(() => {});
}

/**
 * Delete a client
 */
export async function deleteClient(clientId: string): Promise<{ success: boolean; error?: string }> {
  const invoices = await getInvoices();
  const hasInvoices = invoices.some(inv => inv.clientId === clientId);
  if (hasInvoices) {
    return {
      success: false,
      error: 'Cannot delete client. This client is associated with existing invoices!'
    };
  }
  const clients = await getClients();
  const filtered = clients.filter(c => c.id !== clientId);
  await AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(filtered));
  deleteRemoteClient(clientId).catch(() => {});
  return { success: true };
}

/**
 * Get all invoices (Remote MongoDB -> Local Cache Fallback)
 */
export async function getInvoices(): Promise<Invoice[]> {
  try {
    const remote = await fetchRemoteInvoices();
    if (remote && remote.length > 0) {
      const sorted = remote.sort(
        (a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
      );
      await AsyncStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(sorted));
      return sorted;
    }
  } catch {}

  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.INVOICES);
    if (data) {
      const invoices: Invoice[] = JSON.parse(data);
      return invoices.sort(
        (a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
      );
    }
    return DEFAULT_INVOICES;
  } catch {
    return [];
  }
}

/**
 * Save or update an invoice
 */
export async function saveInvoice(invoice: Invoice): Promise<void> {
  const invoices = await getInvoices();
  const index = invoices.findIndex(inv => inv.id === invoice.id);
  const now = new Date().toISOString();

  if (index >= 0) {
    invoices[index] = {
      ...invoice,
      updatedAt: now
    };
  } else {
    invoices.unshift({
      ...invoice,
      id: invoice.id || `inv-${Date.now()}`,
      createdAt: invoice.createdAt || now,
      updatedAt: now
    });
  }
  await AsyncStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  saveRemoteInvoice(invoice).catch(() => {});
}

/**
 * Delete an invoice
 */
export async function deleteInvoice(invoiceId: string): Promise<void> {
  const invoices = await getInvoices();
  const filtered = invoices.filter(inv => inv.id !== invoiceId);
  await AsyncStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(filtered));
  deleteRemoteInvoice(invoiceId).catch(() => {});
}

/**
 * Quick status update
 */
export async function updateInvoiceStatus(invoiceId: string, status: InvoiceStatus): Promise<void> {
  const invoices = await getInvoices();
  const index = invoices.findIndex(inv => inv.id === invoiceId);
  if (index >= 0) {
    invoices[index].status = status;
    invoices[index].updatedAt = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  }
  updateRemoteInvoiceStatus(invoiceId, status).catch(() => {});
}

/**
 * Export all data to JSON string for backup
 */
export async function exportAllData(): Promise<string> {
  const [settings, clients, invoices] = await Promise.all([
    getCompanySettings(),
    getClients(),
    getInvoices()
  ]);
  return JSON.stringify({ settings, clients, invoices, exportedAt: new Date().toISOString() }, null, 2);
}

/**
 * Import all data from JSON string
 */
export async function importAllData(jsonStr: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.settings) await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed.settings));
    if (parsed.clients) await AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(parsed.clients));
    if (parsed.invoices) await AsyncStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(parsed.invoices));
    return true;
  } catch {
    return false;
  }
}

/**
 * Reset to initial factory defaults
 */
export async function resetToDefaults(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_COMPANY_SETTINGS));
  await AsyncStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(DEFAULT_CLIENTS));
  await AsyncStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(DEFAULT_INVOICES));
}
