import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  SafeAreaView,
  StyleSheet,
  ToastAndroid,
  View
} from 'react-native';
import { BottomNav } from './src/components/BottomNav';
import { Header } from './src/components/Header';
import { ClientsScreen } from './src/screens/ClientsScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { InvoiceFormScreen } from './src/screens/InvoiceFormScreen';
import { InvoicesScreen } from './src/screens/InvoicesScreen';
import { InvoiceViewScreen } from './src/screens/InvoiceViewScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { checkIsLoggedIn, initAuth, logout } from './src/services/auth';
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>('dashboard');
  const [screenHistory, setScreenHistory] = useState<ActiveScreen[]>(['dashboard']);
  const [lastBackPress, setLastBackPress] = useState<number>(0);

  const navigateTo = (screen: ActiveScreen) => {
    if (screen !== currentScreen) {
      setScreenHistory(prev => [...prev, screen]);
      setCurrentScreen(screen);
    }
  };

  const handleGoBack = (): boolean => {
    // If viewing, editing or creating an invoice, go back to invoices list
    if (
      currentScreen === 'invoice-view' ||
      currentScreen === 'invoice-edit' ||
      currentScreen === 'invoice-create'
    ) {
      setCurrentScreen('invoices');
      setScreenHistory(prev => prev.filter(s => s !== currentScreen));
      return true;
    }

    // If on another main screen (clients, invoices, settings), return to dashboard
    if (currentScreen !== 'dashboard') {
      setCurrentScreen('dashboard');
      setScreenHistory(['dashboard']);
      return true;
    }

    // If already on dashboard, require a second press within 2 seconds to exit app
    const now = Date.now();
    if (now - lastBackPress < 2000) {
      BackHandler.exitApp();
      return true;
    }

    setLastBackPress(now);
    if (Platform.OS === 'android') {
      ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
    }
    return true; // Prevent app exit on single back press
  };

  useEffect(() => {
    const onBackPress = () => {
      return handleGoBack();
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );

    return () => subscription.remove();
  }, [currentScreen, lastBackPress]);

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
    await initAuth();
    const loggedIn = await checkIsLoggedIn();
    setIsAuthenticated(loggedIn);

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
    navigateTo('invoice-create');
  };

  const handleViewInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    navigateTo('invoice-view');
  };

  const handleEditInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    navigateTo('invoice-edit');
  };

  const handleResetData = async () => {
    await resetToDefaults();
    await loadData();
    navigateTo('dashboard');
  };

  const handleImportData = async (jsonStr: string) => {
    const success = await importAllData(jsonStr);
    if (success) {
      await loadData();
    }
    return success;
  };

  const handleLogout = async () => {
    await logout();
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // If not logged in, show Login Screen
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Top Header */}
      <Header
        currentScreen={currentScreen}
        company={company}
        onNavigate={navigateTo}
        onNewInvoice={handleNewInvoice}
        onBack={handleGoBack}
        onLogout={handleLogout}
      />

      {/* Screen Body */}
      <View style={styles.screenContainer}>
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            invoices={invoices}
            clientCount={clients.length}
            onNavigate={navigateTo}
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
            onCancel={() => navigateTo('invoices')}
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
                navigateTo('invoice-view');
              } else {
                navigateTo('invoices');
              }
            }}
          />
        )}

        {currentScreen === 'invoice-view' && selectedInvoice && (
          <InvoiceViewScreen
            invoice={selectedInvoice}
            company={company}
            onEdit={handleEditInvoice}
            onBack={() => navigateTo('invoices')}
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
            onLogout={handleLogout}
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
            navigateTo(screen);
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
