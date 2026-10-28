import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { checkServerHealth, getDefaultApiUrl, getBackendApiUrl, setBackendApiUrl } from '../services/api';
import { changePassword } from '../services/auth';
import { colors, spacing } from '../theme';
import { CompanySettings } from '../types';

interface SettingsScreenProps {
  company: CompanySettings;
  onSaveCompany: (settings: CompanySettings) => void;
  onExportData: () => Promise<string>;
  onImportData: (jsonStr: string) => Promise<boolean>;
  onResetData: () => Promise<void>;
  onLogout?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  company,
  onSaveCompany,
  onExportData,
  onImportData,
  onResetData,
  onLogout
}) => {
  // Company details
  const [name, setName] = useState(company.name);
  const [address, setAddress] = useState(company.address);
  const [phone, setPhone] = useState(company.phone);
  const [email, setEmail] = useState(company.email);
  const [gstin, setGstin] = useState(company.gstin);
  const [state, setState] = useState(company.state);

  // Bank details
  const [bankName, setBankName] = useState(company.bankName);
  const [branch, setBranch] = useState(company.branch);
  const [accountNo, setAccountNo] = useState(company.accountNo);
  const [ifscCode, setIfscCode] = useState(company.ifscCode);

  // Tax and terms
  const [terms, setTerms] = useState(company.terms);
  const [cgstRate, setCgstRate] = useState(String(company.defaultCgstRate || 9));
  const [sgstRate, setSgstRate] = useState(String(company.defaultSgstRate || 9));

  // MongoDB API server config
  const [apiUrl, setApiUrl] = useState(getDefaultApiUrl());
  const [connectionStatus, setConnectionStatus] = useState<string>('Not tested');
  const [testingConnection, setTestingConnection] = useState(false);

  // Password reset state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showMsg('Validation Error', 'Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMsg('Validation Error', 'New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 6) {
      showMsg('Validation Error', 'New password must be at least 6 characters long.');
      return;
    }

    setPasswordUpdating(true);
    const res = await changePassword(currentPassword, newPassword);
    setPasswordUpdating(false);

    if (res.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showMsg('Success', res.message);
    } else {
      showMsg('Error', res.message);
    }
  };

  React.useEffect(() => {
    getBackendApiUrl().then(url => {
      setApiUrl(url);
    });
  }, []);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    await setBackendApiUrl(apiUrl);
    const result = await checkServerHealth(apiUrl);
    setConnectionStatus(result.message);
    setTestingConnection(false);
  };

  // Backup modal
  const [backupModalVisible, setBackupModalVisible] = useState(false);
  const [backupJson, setBackupJson] = useState('');
  const [backupMode, setBackupMode] = useState<'export' | 'import'>('export');

  const handleSave = () => {
    if (!name.trim()) {
      showMsg('Error', 'Company name is required');
      return;
    }

    const updated: CompanySettings = {
      ...company,
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      gstin: gstin.trim(),
      state: state.trim(),
      bankName: bankName.trim(),
      branch: branch.trim(),
      accountNo: accountNo.trim(),
      ifscCode: ifscCode.trim(),
      terms: terms.trim(),
      defaultCgstRate: Number(cgstRate) || 9,
      defaultSgstRate: Number(sgstRate) || 9
    };

    onSaveCompany(updated);
    showMsg('Success', 'Company & Bank settings saved successfully!');
  };

  const handleExport = async () => {
    const json = await onExportData();
    setBackupJson(json);
    setBackupMode('export');
    setBackupModalVisible(true);
  };

  const handleOpenImport = () => {
    setBackupJson('');
    setBackupMode('import');
    setBackupModalVisible(true);
  };

  const handleImportSubmit = async () => {
    if (!backupJson.trim()) {
      showMsg('Error', 'Please paste valid JSON data to import.');
      return;
    }
    const success = await onImportData(backupJson);
    if (success) {
      setBackupModalVisible(false);
      showMsg('Success', 'Data imported successfully!');
    } else {
      showMsg('Error', 'Failed to import data. Please ensure the JSON is valid.');
    }
  };

  const handleReset = async () => {
    const doReset = async () => {
      await onResetData();
      showMsg('Reset Complete', 'Database has been reset to default demo data.');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to reset all data back to factory defaults?')) {
        await doReset();
      }
    } else {
      Alert.alert(
        'Reset to Defaults',
        'Are you sure you want to reset all data back to factory defaults?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: doReset }
        ]
      );
    }
  };

  const showMsg = (title: string, msg: string) => {
    if (Platform.OS === 'web') alert(`${title}: ${msg}`);
    else Alert.alert(title, msg);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Header & Save */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.pageTitle}>Settings & Profile</Text>
          <Text style={styles.pageSubtitle}>Configure issuer details, bank account, and GST defaults</Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Ionicons name="save-outline" size={18} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>Save Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Issuer Company Details Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="business-outline" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Issuer Business Details</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Company / Business Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. NA NATURAL AIR CONDITION"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.formRow}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Business GSTIN *</Text>
            <TextInput
              style={styles.input}
              value={gstin}
              onChangeText={setGstin}
              placeholder="e.g. 23AORPA7441L1ZR"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>State & State Code *</Text>
            <TextInput
              style={styles.input}
              value={state}
              onChangeText={setState}
              placeholder="e.g. STATE 23 Madhya Pradesh"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 9111303654"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. contact@domain.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Registered Business Address *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={address}
            onChangeText={setAddress}
            placeholder="Full business address for invoice header"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Bank Account Details */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="card-outline" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Bank Account Details (Printed on Invoices)</Text>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Bank Name</Text>
            <TextInput
              style={styles.input}
              value={bankName}
              onChangeText={setBankName}
              placeholder="e.g. UCO BANK"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Branch Name</Text>
            <TextInput
              style={styles.input}
              value={branch}
              onChangeText={setBranch}
              placeholder="e.g. BALVINAYMANDER INDORE"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Account Number</Text>
            <TextInput
              style={styles.input}
              value={accountNo}
              onChangeText={setAccountNo}
              placeholder="e.g. 19950110059142"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>IFSC Code</Text>
            <TextInput
              style={styles.input}
              value={ifscCode}
              onChangeText={setIfscCode}
              placeholder="e.g. UCBA0001995"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>
      </View>

      {/* Tax Rates & Terms */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="calculator-outline" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Tax Rates & Terms and Conditions</Text>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Default CGST Rate (%)</Text>
            <TextInput
              style={styles.input}
              value={cgstRate}
              onChangeText={setCgstRate}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Default SGST Rate (%)</Text>
            <TextInput
              style={styles.input}
              value={sgstRate}
              onChangeText={setSgstRate}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Terms & Conditions</Text>
          <TextInput
            style={[styles.input, styles.textAreaLarge]}
            value={terms}
            onChangeText={setTerms}
            placeholder="Terms printed on bottom of invoices"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
          />
        </View>
      </View>

      {/* Cloud Database & MongoDB Server Configuration Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="server-outline" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Cloud Database & Server (MongoDB)</Text>
        </View>

        <Text style={styles.maintenanceDesc}>
          Connect your Web deployment and Android APK to the same MongoDB backend so your invoices and clients stay synchronized in real time across all devices.
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Backend API Server Endpoint</Text>
          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="e.g. https://my-bill-app.koyeb.app/api or http://localhost:5001/api"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.serverStatusRow}>
          <TouchableOpacity
            style={[styles.maintBtn, { backgroundColor: colors.primaryMuted, borderColor: colors.primary }]}
            onPress={handleTestConnection}
            disabled={testingConnection}
          >
            <Ionicons name="wifi-outline" size={18} color={colors.primary} />
            <Text style={styles.maintBtnText}>
              {testingConnection ? 'Testing Connection...' : 'Save & Test Connection'}
            </Text>
          </TouchableOpacity>

          <View style={styles.statusPill}>
            <Text style={styles.statusPillLabel}>Status: </Text>
            <Text style={[styles.statusPillValue, { color: connectionStatus.includes('Connected') ? colors.success : colors.warning }]}>
              {connectionStatus}
            </Text>
          </View>
        </View>
      </View>

      {/* Account Security & Password Reset Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="shield-outline" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Account Security & Password Reset</Text>
        </View>

        <Text style={styles.maintenanceDesc}>
          Logged in as <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>arshan</Text>. You can update your password below. It will synchronize with your MongoDB database and local device.
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Current Password *</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
          />
        </View>

        <View style={styles.formRow}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>New Password (min 6 chars) *</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Confirm New Password *</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter new password"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 4, flexWrap: 'wrap' }}>
          <TouchableOpacity
            style={[styles.maintBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={handleChangePassword}
            disabled={passwordUpdating}
          >
            <Ionicons name="key-outline" size={18} color="#FFFFFF" />
            <Text style={[styles.maintBtnText, { color: '#FFFFFF', fontWeight: '700' }]}>
              {passwordUpdating ? 'Updating Password...' : 'Update Password'}
            </Text>
          </TouchableOpacity>

          {onLogout && (
            <TouchableOpacity
              style={[styles.maintBtn, { borderColor: colors.danger, backgroundColor: colors.dangerMuted }]}
              onPress={onLogout}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              <Text style={[styles.maintBtnText, { color: colors.danger, fontWeight: '700' }]}>
                Sign Out (Logout)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Backup & System Maintenance Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Data Backup & System Maintenance</Text>
        </View>

        <Text style={styles.maintenanceDesc}>
          All your CRM data is safely stored locally on your device. You can export a JSON backup, restore from a backup file, or reset to initial default templates at any time.
        </Text>

        <View style={styles.maintenanceRow}>
          <TouchableOpacity style={styles.maintBtn} onPress={handleExport}>
            <Ionicons name="download-outline" size={18} color={colors.primary} />
            <Text style={styles.maintBtnText}>Export JSON Backup</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.maintBtn} onPress={handleOpenImport}>
            <Ionicons name="cloud-upload-outline" size={18} color={colors.info} />
            <Text style={[styles.maintBtnText, { color: colors.info }]}>Import Backup</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.maintBtn, { borderColor: colors.danger }]} onPress={handleReset}>
            <Ionicons name="refresh-outline" size={18} color={colors.danger} />
            <Text style={[styles.maintBtnText, { color: colors.danger }]}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Backup JSON Modal */}
      <Modal
        animationType="fade"
        transparent
        visible={backupModalVisible}
        onRequestClose={() => setBackupModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {backupMode === 'export' ? 'JSON Data Backup' : 'Import JSON Data'}
              </Text>
              <TouchableOpacity onPress={() => setBackupModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalHint}>
                {backupMode === 'export'
                  ? 'Copy this JSON backup text or save it in a safe place:'
                  : 'Paste your previously exported JSON data below to restore:'}
              </Text>
              <TextInput
                style={styles.jsonInput}
                value={backupJson}
                onChangeText={setBackupJson}
                multiline
                numberOfLines={12}
                editable={backupMode === 'import'}
                placeholder="Paste backup JSON here..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setBackupModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Close</Text>
              </TouchableOpacity>
              {backupMode === 'import' && (
                <TouchableOpacity style={styles.modalSaveBtn} onPress={handleImportSubmit}>
                  <Text style={styles.modalSaveText}>Restore Data</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: spacing.md,
    paddingBottom: 60,
    gap: spacing.md
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary
  },
  pageSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  saveBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: 8
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.sm
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap'
  },
  formGroup: {
    flex: 1,
    minWidth: 140,
    gap: 4
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: 13
  },
  textArea: {
    minHeight: 65,
    textAlignVertical: 'top'
  },
  textAreaLarge: {
    minHeight: 90,
    textAlignVertical: 'top'
  },
  maintenanceDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18
  },
  maintenanceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap'
  },
  maintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  maintBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary
  },
  serverStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 4
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border
  },
  statusPillLabel: {
    fontSize: 12,
    color: colors.textSecondary
  },
  statusPillValue: {
    fontSize: 12,
    fontWeight: '700'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md
  },
  modalBox: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  modalBody: {
    padding: spacing.md,
    gap: spacing.sm
  },
  modalHint: {
    fontSize: 12,
    color: colors.textSecondary
  },
  jsonInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.sm,
    color: colors.textPrimary,
    fontFamily: 'monospace',
    fontSize: 11,
    height: 200,
    textAlignVertical: 'top'
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600'
  },
  modalSaveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  }
});
