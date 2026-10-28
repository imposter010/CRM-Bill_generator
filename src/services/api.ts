import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client, CompanySettings, Invoice, InvoiceStatus } from '../types';

const API_STORAGE_KEY = '@crm_backend_api_url';

export function getDefaultApiUrl(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return `${window.location.origin}/api`;
  }
  return 'https://crm-bill-generator-server.vercel.app/api';
}

export const DEFAULT_API_URL = getDefaultApiUrl();

export async function getBackendApiUrl(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(API_STORAGE_KEY);
    if (saved && saved.trim()) {
      // If we are on a remote web domain (e.g. vercel.app) but saved url is localhost, auto-fix to current origin
      if (
        typeof window !== 'undefined' &&
        window.location &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1' &&
        (saved.includes('localhost') || saved.includes('127.0.0.1'))
      ) {
        const correctUrl = `${window.location.origin}/api`;
        await AsyncStorage.setItem(API_STORAGE_KEY, correctUrl);
        return correctUrl;
      }
      return saved;
    }
    return getDefaultApiUrl();
  } catch {
    return getDefaultApiUrl();
  }
}

/**
 * Save custom Backend API URL
 */
export async function setBackendApiUrl(url: string): Promise<void> {
  const clean = url.trim().replace(/\/+$/, '');
  const finalUrl = clean.endsWith('/api') ? clean : `${clean}/api`;
  await AsyncStorage.setItem(API_STORAGE_KEY, finalUrl);
}

/**
 * Test server connectivity
 */
export async function checkServerHealth(apiUrl?: string): Promise<{ ok: boolean; message: string }> {
  try {
    const base = apiUrl || (await getBackendApiUrl());
    const res = await fetch(`${base}/health`, { method: 'GET' });
    if (!res.ok) {
      return { ok: false, message: `Server returned status ${res.status}` };
    }
    const data = await res.json();
    return { ok: true, message: `Connected (DB: ${data.database})` };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Failed to connect to server' };
  }
}

/**
 * Fetch company settings from MongoDB
 */
export async function fetchRemoteSettings(): Promise<CompanySettings | null> {
  try {
    const base = await getBackendApiUrl();
    const res = await fetch(`${base}/settings`);
    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        id: data._id || data.id || 'company-default'
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Save company settings to MongoDB
 */
export async function saveRemoteSettings(settings: CompanySettings): Promise<boolean> {
  try {
    const base = await getBackendApiUrl();
    const res = await fetch(`${base}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch clients from MongoDB
 */
export async function fetchRemoteClients(): Promise<Client[] | null> {
  try {
    const base = await getBackendApiUrl();
    const res = await fetch(`${base}/clients`);
    if (res.ok) {
      const data = await res.json();
      return data.map((c: any) => ({
        ...c,
        id: c._id || c.id
      }));
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Save or update client in MongoDB
 */
export async function saveRemoteClient(client: Client): Promise<Client | null> {
  try {
    const base = await getBackendApiUrl();
    const res = await fetch(`${base}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client)
    });
    if (res.ok) {
      const data = await res.json();
      return { ...data, id: data._id || data.id };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Delete client in MongoDB
 */
export async function deleteRemoteClient(clientId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const base = await getBackendApiUrl();
    const res = await fetch(`${base}/clients/${clientId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to delete client' };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Server error' };
  }
}

/**
 * Fetch invoices from MongoDB
 */
export async function fetchRemoteInvoices(): Promise<Invoice[] | null> {
  try {
    const base = await getBackendApiUrl();
    const res = await fetch(`${base}/invoices`);
    if (res.ok) {
      const data = await res.json();
      return data.map((inv: any) => ({
        ...inv,
        id: inv._id || inv.id
      }));
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Save or update invoice in MongoDB
 */
export async function saveRemoteInvoice(invoice: Invoice): Promise<Invoice | null> {
  try {
    const base = await getBackendApiUrl();
    const res = await fetch(`${base}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice)
    });
    if (res.ok) {
      const data = await res.json();
      return { ...data, id: data._id || data.id };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Delete invoice in MongoDB
 */
export async function deleteRemoteInvoice(invoiceId: string): Promise<boolean> {
  try {
    const base = await getBackendApiUrl();
    const res = await fetch(`${base}/invoices/${invoiceId}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Quick update status in MongoDB
 */
export async function updateRemoteInvoiceStatus(invoiceId: string, status: InvoiceStatus): Promise<boolean> {
  try {
    const base = await getBackendApiUrl();
    const res = await fetch(`${base}/invoices/${invoiceId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.ok;
  } catch {
    return false;
  }
}
