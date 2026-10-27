import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  View
} from 'react-native';
import { BottomNav } from './src/components/BottomNav';
import { Header } from './src/components/Header';
import { ClientsScreen } from './src/screens/ClientsScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { InvoiceFormScreen } from './src/screens/InvoiceFormScreen';
import { InvoicesScreen } from './src/screens/InvoicesScreen';
import { InvoiceViewScreen } from './src/screens/InvoiceViewScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import {
  deleteClient,
  deleteInvoice,
  exportAllData,
  getClients,
  getCompanySettings,
  getInvoices,
  importAllData,
  initializeStorage,
  resetToDefaults,
  saveClient,
  saveCompanySettings,
  saveInvoice,
  updateInvoiceStatus
} from './src/services/storage';
import { colors } from './src/theme';
import { ActiveScreen, Client, CompanySettings, Invoice, InvoiceStatus } from './src/types';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('dashboard');

  const [company, setCompany] = useState<CompanySettings>({
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
    terms: 'Terms & conditions :\n1. If the payment is not made within 15 days.\n2. Subject to INDORE Jurisdiction.\n3. E. & O.E.',
    defaultCgstRate: 9,
    defaultSgstRate: 9
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Load data from storage
  const loadData = async () => {
    await initializeStorage();
    const [savedCompany, savedClients, savedInvoices] = await Promise.all([
      getCompanySettings(),
      getClients(),
      getInvoices()
    ]);
    setCompany(savedCompany);
    setClients(savedClients);
    setInvoices(savedInvoices);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers
  const handleSaveCompany = async (updatedSettings: CompanySettings) => {
    setCompany(updatedSettings);
    await saveCompanySettings(updatedSettings);
  };

  const handleSaveClient = async (client: Client) => {
    await saveClient(client);
    const updated = await getClients();
    setClients(updated);
  };

  const handleDeleteClient = async (clientId: string) => {
    const res = await deleteClient(clientId);
    if (res.success) {
      const updated = await getClients();
      setClients(updated);
    }
    return res;
  };

  const handleSaveInvoice = async (invoice: Invoice) => {
    await saveInvoice(invoice);
    const updated = await getInvoices();
    setInvoices(updated);
    setSelectedInvoice(invoice);
    setCurrentScreen('invoice-view');
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    await deleteInvoice(invoiceId);
    const updated = await getInvoices();
    setInvoices(updated);
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, status: InvoiceStatus) => {
    await updateInvoiceStatus(invoiceId, status);
    const updated = await getInvoices();
    setInvoices(updated);
  };

  const handleNewInvoice = () => {
    setSelectedInvoice(null);
    setCurrentScreen('invoice-create');
  };

  const handleViewInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setCurrentScreen('invoice-view');
  };

  const handleEditInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setCurrentScreen('invoice-edit');
  };

  const handleResetData = async () => {
    await resetToDefaults();
    await loadData();
    setCurrentScreen('dashboard');
  };

  const handleImportData = async (jsonStr: string) => {
    const success = await importAllData(jsonStr);
    if (success) {
      await loadData();
    }
    return success;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Top Header */}
      <Header
        currentScreen={currentScreen}
        company={company}
        onNavigate={setCurrentScreen}
        onNewInvoice={handleNewInvoice}
      />

      {/* Screen Body */}
      <View style={styles.screenContainer}>
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            invoices={invoices}
            clientCount={clients.length}
            onNavigate={setCurrentScreen}
            onViewInvoice={handleViewInvoice}
            onEditInvoice={handleEditInvoice}
            onNewInvoice={handleNewInvoice}
          />
        )}

        {currentScreen === 'invoices' && (
          <InvoicesScreen
            invoices={invoices}
            onViewInvoice={handleViewInvoice}
            onEditInvoice={handleEditInvoice}
            onDeleteInvoice={handleDeleteInvoice}
            onUpdateStatus={handleUpdateInvoiceStatus}
            onNewInvoice={handleNewInvoice}
          />
        )}

        {currentScreen === 'invoice-create' && (
          <InvoiceFormScreen
            clients={clients}
            invoices={invoices}
            company={company}
            onSave={handleSaveInvoice}
            onCancel={() => setCurrentScreen('invoices')}
          />
        )}

        {currentScreen === 'invoice-edit' && (
          <InvoiceFormScreen
            existingInvoice={selectedInvoice}
            clients={clients}
            invoices={invoices}
            company={company}
            onSave={handleSaveInvoice}
            onCancel={() => {
              if (selectedInvoice) {
                setCurrentScreen('invoice-view');
              } else {
                setCurrentScreen('invoices');
              }
            }}
          />
        )}

        {currentScreen === 'invoice-view' && selectedInvoice && (
          <InvoiceViewScreen
            invoice={selectedInvoice}
            company={company}
            onEdit={handleEditInvoice}
            onBack={() => setCurrentScreen('invoices')}
          />
        )}

        {currentScreen === 'clients' && (
          <ClientsScreen
            clients={clients}
            invoices={invoices}
            onSaveClient={handleSaveClient}
            onDeleteClient={handleDeleteClient}
          />
        )}

        {currentScreen === 'settings' && (
          <SettingsScreen
            company={company}
            onSaveCompany={handleSaveCompany}
            onExportData={exportAllData}
            onImportData={handleImportData}
            onResetData={handleResetData}
          />
        )}
      </View>

      {/* Bottom Nav Bar */}
      <BottomNav
        currentScreen={currentScreen}
        onNavigate={screen => {
          if (screen === 'invoice-create') {
            handleNewInvoice();
          } else {
            setCurrentScreen(screen);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center'
  },
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background
  }
});
