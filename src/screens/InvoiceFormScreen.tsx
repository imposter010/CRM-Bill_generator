import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { colors, spacing } from '../theme';
import { Client, CompanySettings, Invoice, InvoiceItem, InvoiceStatus } from '../types';
import { formatCurrency, generateNextInvoiceNo, getTodayString } from '../utils/formatters';
import { getAmountInWords } from '../utils/numberToWords';

interface InvoiceFormScreenProps {
  existingInvoice?: Invoice | null;
  clients: Client[];
  invoices: Invoice[];
  company: CompanySettings;
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
}

export const InvoiceFormScreen: React.FC<InvoiceFormScreenProps> = ({
  existingInvoice,
  clients,
  invoices,
  company,
  onSave,
  onCancel
}) => {
  const isEditing = Boolean(existingInvoice);

  // Form State
  const [invoiceNo, setInvoiceNo] = useState(
    existingInvoice ? existingInvoice.invoiceNo : generateNextInvoiceNo(invoices)
  );
  const [invoiceDate, setInvoiceDate] = useState(
    existingInvoice ? existingInvoice.invoiceDate : getTodayString()
  );
  const [clientId, setClientId] = useState<string | undefined>(existingInvoice?.clientId);
  const [clientName, setClientName] = useState(existingInvoice?.clientName || '');
  const [clientAddress, setClientAddress] = useState(existingInvoice?.clientAddress || '');
  const [clientGstin, setClientGstin] = useState(existingInvoice?.clientGstin || '');
  const [clientPhone, setClientPhone] = useState(existingInvoice?.clientPhone || '');

  const [paymentMethod, setPaymentMethod] = useState(existingInvoice?.paymentMethod || 'Bank Transfer');
  const [lrNo, setLrNo] = useState(existingInvoice?.lrNo || '');
  const [vehicleNo, setVehicleNo] = useState(existingInvoice?.vehicleNo || '');
  const [placeOfSupply, setPlaceOfSupply] = useState(existingInvoice?.placeOfSupply || 'Indore');
  const [dateOfSupply, setDateOfSupply] = useState(
    existingInvoice?.dateOfSupply || getTodayString()
  );
  const [reverseCharge, setReverseCharge] = useState<'Yes' | 'No'>(
    existingInvoice?.reverseCharge || 'No'
  );
  const [status, setStatus] = useState<InvoiceStatus>(existingInvoice?.status || 'draft');

  // Line Items
  const [items, setItems] = useState<InvoiceItem[]>(
    existingInvoice?.items && existingInvoice.items.length > 0
      ? existingInvoice.items
      : [
          {
            id: 'item-1',
            sno: 1,
            particulars: '',
            hsnCode: '',
            quantity: 1,
            rate: 0,
            amount: 0
          }
        ]
  );

  // Tax rates
  const cgstRate = existingInvoice?.cgstRate ?? company.defaultCgstRate ?? 9;
  const sgstRate = existingInvoice?.sgstRate ?? company.defaultSgstRate ?? 9;

  // Computed Totals
  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const cgstAmount = Math.round(((subtotal * cgstRate) / 100) * 100) / 100;
  const sgstAmount = Math.round(((subtotal * sgstRate) / 100) * 100) / 100;
  const totalAmount = Math.round((subtotal + cgstAmount + sgstAmount) * 100) / 100;
  const amountInWords = getAmountInWords(totalAmount);

  // Client dropdown modal state
  const [showClientPicker, setShowClientPicker] = useState(false);

  // Select client from registry
  const handleSelectClient = (client: Client) => {
    setClientId(client.id);
    setClientName(client.name);
    setClientAddress(client.address);
    setClientGstin(client.gstin);
    setClientPhone(client.phone);
    setShowClientPicker(false);
  };

  // Add Item Row
  const addItemRow = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      sno: items.length + 1,
      particulars: '',
      hsnCode: '',
      quantity: 1,
      rate: 0,
      amount: 0
    };
    setItems([...items, newItem]);
  };

  // Remove Item Row
  const removeItemRow = (index: number) => {
    if (items.length === 1) {
      // Keep at least one row, just reset it
      setItems([
        {
          id: `item-${Date.now()}`,
          sno: 1,
          particulars: '',
          hsnCode: '',
          quantity: 1,
          rate: 0,
          amount: 0
        }
      ]);
      return;
    }
    const updated = items.filter((_, idx) => idx !== index).map((item, idx) => ({
      ...item,
      sno: idx + 1
    }));
    setItems(updated);
  };

  // Update item field
  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'rate') {
      const q = field === 'quantity' ? Number(value) || 0 : Number(item.quantity) || 0;
      const r = field === 'rate' ? Number(value) || 0 : Number(item.rate) || 0;
      item.amount = Math.round(q * r * 100) / 100;
    }

    updated[index] = item;
    setItems(updated);
  };

  // Validate and submit
  const handleSubmit = () => {
    if (!invoiceNo.trim()) {
      showNotice('Validation Error', 'Invoice Number is required!');
      return;
    }
    if (!clientName.trim()) {
      showNotice('Validation Error', 'Client billing name is required!');
      return;
    }
    const validItems = items.filter(it => it.particulars.trim().length > 0);
    if (validItems.length === 0) {
      showNotice('Validation Error', 'Please enter at least one item description!');
      return;
    }

    // Check duplicate invoice no if creating
    if (!isEditing) {
      const exists = invoices.some(
        inv => inv.invoiceNo.trim().toLowerCase() === invoiceNo.trim().toLowerCase()
      );
      if (exists) {
        showNotice('Validation Error', `Invoice number '${invoiceNo}' already exists!`);
        return;
      }
    }

    const invoiceToSave: Invoice = {
      id: existingInvoice ? existingInvoice.id : `inv-${Date.now()}`,
      invoiceNo: invoiceNo.trim(),
      invoiceDate: invoiceDate.trim(),
      clientId,
      clientName: clientName.trim(),
      clientAddress: clientAddress.trim(),
      clientGstin: clientGstin.trim(),
      clientPhone: clientPhone.trim(),
      paymentMethod,
      lrNo: lrNo.trim(),
      vehicleNo: vehicleNo.trim(),
      placeOfSupply: placeOfSupply.trim(),
      dateOfSupply: dateOfSupply.trim(),
      reverseCharge,
      subtotal,
      cgstRate,
      sgstRate,
      cgstAmount,
      sgstAmount,
      totalAmount,
      amountInWords,
      status,
      items: validItems,
      createdAt: existingInvoice ? existingInvoice.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(invoiceToSave);
  };

  const showNotice = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top action header */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
          <Text style={styles.cancelBtnText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
          <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>{isEditing ? 'Update Invoice' : 'Save Invoice'}</Text>
        </TouchableOpacity>
      </View>

      {/* Grid: Invoice Details & Client Details */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="receipt-outline" size={18} color={colors.primary} />
          <Text style={styles.cardTitle}>Invoice Metadata</Text>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Invoice Number *</Text>
            <TextInput
              style={styles.input}
              value={invoiceNo}
              onChangeText={setInvoiceNo}
              placeholder="e.g. INV-0001"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Invoice Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              value={invoiceDate}
              onChangeText={setInvoiceDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Payment Method</Text>
            <View style={styles.radioRow}>
              {['Bank Transfer', 'Cash', 'UPI', 'Cheque'].map(method => (
                <TouchableOpacity
                  key={method}
                  style={[
                    styles.methodChip,
                    paymentMethod === method && styles.activeMethodChip
                  ]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Text
                    style={[
                      styles.methodChipText,
                      paymentMethod === method && styles.activeMethodChipText
                    ]}
                  >
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Invoice Status</Text>
            <View style={styles.radioRow}>
              {(['draft', 'sent', 'paid', 'cancelled'] as InvoiceStatus[]).map(st => (
                <TouchableOpacity
                  key={st}
                  style={[styles.statusChip, status === st && styles.activeStatusChip]}
                  onPress={() => setStatus(st)}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      status === st && styles.activeStatusChipText
                    ]}
                  >
                    {st.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.formRow}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Place of Supply</Text>
            <TextInput
              style={styles.input}
              value={placeOfSupply}
              onChangeText={setPlaceOfSupply}
              placeholder="e.g. Indore"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Date of Supply</Text>
            <TextInput
              style={styles.input}
              value={dateOfSupply}
              onChangeText={setDateOfSupply}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>L.R. Number</Text>
            <TextInput
              style={styles.input}
              value={lrNo}
              onChangeText={setLrNo}
              placeholder="Optional LR number"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Vehicle Number</Text>
            <TextInput
              style={styles.input}
              value={vehicleNo}
              onChangeText={setVehicleNo}
              placeholder="e.g. MP-09-AB-1234"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Reverse Charge?</Text>
            <View style={styles.radioRow}>
              {(['No', 'Yes'] as ('No' | 'Yes')[]).map(val => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.methodChip,
                    reverseCharge === val && styles.activeMethodChip
                  ]}
                  onPress={() => setReverseCharge(val)}
                >
                  <Text
                    style={[
                      styles.methodChipText,
                      reverseCharge === val && styles.activeMethodChipText
                    ]}
                  >
                    {val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Client Information Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="person-outline" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Client Information (Billed To)</Text>
          </View>

          {clients.length > 0 && (
            <TouchableOpacity
              style={styles.selectClientBtn}
              onPress={() => setShowClientPicker(!showClientPicker)}
            >
              <Ionicons name="people-outline" size={15} color={colors.primary} />
              <Text style={styles.selectClientText}>
                {showClientPicker ? 'Hide Clients' : 'Choose Registered Client'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Client quick picker */}
        {showClientPicker && (
          <View style={styles.clientPickerBox}>
            <Text style={styles.pickerHeader}>Select client to autofill details:</Text>
            <ScrollView style={styles.clientPickerScroll}>
              {clients.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.clientPickerItem}
                  onPress={() => handleSelectClient(c)}
                >
                  <Text style={styles.clientPickerName}>{c.name}</Text>
                  <Text style={styles.clientPickerDetails}>
                    {c.gstin ? `GSTIN: ${c.gstin}` : 'No GSTIN'} • {c.phone || 'No Phone'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Client Billing Name *</Text>
          <TextInput
            style={styles.input}
            value={clientName}
            onChangeText={setClientName}
            placeholder="Enter client or company name"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.formRow}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Client GSTIN</Text>
            <TextInput
              style={styles.input}
              value={clientGstin}
              onChangeText={setClientGstin}
              placeholder="e.g. 23AORPA7441L1ZR"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Client Phone / Mobile</Text>
            <TextInput
              style={styles.input}
              value={clientPhone}
              onChangeText={setClientPhone}
              placeholder="e.g. 9111303654"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Client Billing Address</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={clientAddress}
            onChangeText={setClientAddress}
            placeholder="Enter full client billing address"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Line Items Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="list-outline" size={18} color={colors.primary} />
            <Text style={styles.cardTitle}>Line Items & Services</Text>
          </View>
          <Text style={styles.taxBadgeText}>GST Rate: CGST 9% + SGST 9% (18%)</Text>
        </View>

        {items.map((item, index) => (
          <View key={item.id} style={styles.itemRowContainer}>
            <View style={styles.itemRowHeader}>
              <Text style={styles.itemIndex}>#{index + 1}</Text>
              <TouchableOpacity
                onPress={() => removeItemRow(index)}
                style={styles.removeItemBtn}
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description of Goods / Services *</Text>
              <TextInput
                style={styles.input}
                value={item.particulars}
                onChangeText={val => updateItem(index, 'particulars', val)}
                placeholder="e.g. AC Installation / Copper Pipe Fitting"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1.2 }]}>
                <Text style={styles.label}>HSN/SAC</Text>
                <TextInput
                  style={styles.input}
                  value={item.hsnCode}
                  onChangeText={val => updateItem(index, 'hsnCode', val)}
                  placeholder="e.g. 998719"
                  placeholderTextColor={colors.textMuted}
                />
              </View>

              <View style={[styles.formGroup, { flex: 0.8 }]}>
                <Text style={styles.label}>Qty</Text>
                <TextInput
                  style={styles.input}
                  value={String(item.quantity)}
                  onChangeText={val => updateItem(index, 'quantity', val)}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Rate (₹)</Text>
                <TextInput
                  style={styles.input}
                  value={String(item.rate)}
                  onChangeText={val => updateItem(index, 'rate', val)}
                  keyboardType="numeric"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Amount (₹)</Text>
                <View style={styles.readonlyAmountBox}>
                  <Text style={styles.readonlyAmountText}>{formatCurrency(item.amount)}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addItemBtn} onPress={addItemRow}>
          <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.addItemBtnText}>Add Another Item Row</Text>
        </TouchableOpacity>

        {/* Calculation Summary Breakdown */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryVal}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>CGST ({cgstRate}%):</Text>
            <Text style={styles.summaryVal}>{formatCurrency(cgstAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>SGST ({sgstRate}%):</Text>
            <Text style={styles.summaryVal}>{formatCurrency(sgstAmount)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Invoice Amount:</Text>
            <Text style={styles.totalVal}>{formatCurrency(totalAmount)}</Text>
          </View>

          <View style={styles.wordsBox}>
            <Text style={styles.wordsTitle}>Amount in Words (INR):</Text>
            <Text style={styles.wordsText}>{amountInWords}</Text>
          </View>
        </View>
      </View>

      {/* Bottom Save Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bigSaveBtn} onPress={handleSubmit}>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.bigSaveBtnText}>
            {isEditing ? 'Save Changes' : 'Create & Save Invoice'}
          </Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center'
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 13
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary
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
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.sm
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary
  },
  taxBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary
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
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 4
  },
  radioRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap'
  },
  methodChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  activeMethodChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  methodChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary
  },
  activeMethodChipText: {
    color: '#FFFFFF'
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  activeStatusChip: {
    backgroundColor: colors.info,
    borderColor: colors.info
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary
  },
  activeStatusChipText: {
    color: '#0F172A'
  },
  selectClientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  selectClientText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary
  },
  clientPickerBox: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.sm,
    gap: 6
  },
  pickerHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary
  },
  clientPickerScroll: {
    maxHeight: 140
  },
  clientPickerItem: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  clientPickerName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  clientPickerDetails: {
    fontSize: 11,
    color: colors.textMuted
  },
  itemRowContainer: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm
  },
  itemRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemIndex: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary
  },
  removeItemBtn: {
    padding: 4
  },
  readonlyAmountBox: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    justifyContent: 'center'
  },
  readonlyAmountText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: colors.primaryMuted,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed'
  },
  addItemBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary
  },
  summaryBox: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 6
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    marginTop: 4
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary
  },
  wordsBox: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.sm,
    borderRadius: 6,
    marginTop: 6
  },
  wordsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase'
  },
  wordsText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: colors.textPrimary,
    marginTop: 2
  },
  bottomBar: {
    marginTop: spacing.sm
  },
  bigSaveBtn: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10
  },
  bigSaveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15
  }
});
