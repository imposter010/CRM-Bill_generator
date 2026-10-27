import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { printInvoice, shareInvoicePdf } from '../services/pdfGenerator';
import { colors, spacing } from '../theme';
import { CompanySettings, Invoice } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface InvoiceViewScreenProps {
  invoice: Invoice;
  company: CompanySettings;
  onEdit: (invoice: Invoice) => void;
  onBack: () => void;
}

export const InvoiceViewScreen: React.FC<InvoiceViewScreenProps> = ({
  invoice,
  company,
  onEdit,
  onBack
}) => {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    try {
      setLoading(true);
      await printInvoice(invoice, company);
    } catch (err: any) {
      const msg = err?.message || 'Failed to print invoice';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      setLoading(true);
      await shareInvoicePdf(invoice, company);
    } catch (err: any) {
      const msg = err?.message || 'Failed to share invoice';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Control Action Panel */}
      <View style={styles.controlPanel}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
          <Text style={styles.backBtnText}>Invoices</Text>
        </TouchableOpacity>

        <View style={styles.actionsRight}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => onEdit(invoice)}
            disabled={loading}
          >
            <Ionicons name="pencil-outline" size={16} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShare}
            disabled={loading}
          >
            <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Share / PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.printBtn}
            onPress={handlePrint}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="print-outline" size={16} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Print</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Tax Invoice Document Preview (Clean White Paper Style) */}
      <View style={styles.paper}>
        {/* Top Header */}
        <View style={styles.paperHeader}>
          <View style={styles.companyCol}>
            <Text style={styles.companyTitle}>{company.name}</Text>
            <Text style={styles.companySub}>{company.address}</Text>
            <Text style={styles.companyMeta}>
              Phone: {company.phone} | Email: {company.email}
            </Text>
            <Text style={styles.companyMeta}>
              GSTIN: <Text style={styles.boldText}>{company.gstin}</Text> | State: {company.state}
            </Text>
          </View>

          <View style={styles.badgeCol}>
            <View style={styles.originalBadge}>
              <Text style={styles.originalBadgeText}>ORIGINAL FOR RECIPIENT</Text>
            </View>
            <Text style={styles.invoiceMetaSub}>GST Compliant Tax Invoice</Text>
          </View>
        </View>

        {/* Title Banner */}
        <View style={styles.titleBanner}>
          <Text style={styles.titleBannerText}>TAX INVOICE</Text>
        </View>

        {/* 2-Column Metadata & Client Details */}
        <View style={styles.metaGrid}>
          {/* Left: Billed to */}
          <View style={styles.clientBox}>
            <Text style={styles.boxTitle}>DETAILS OF RECEIVER (BILLED TO):</Text>
            <Text style={styles.clientNameText}>{invoice.clientName}</Text>
            <Text style={styles.clientAddressText}>{invoice.clientAddress}</Text>
            <Text style={styles.clientDetailLine}>
              GSTIN: <Text style={styles.boldText}>{invoice.clientGstin || 'Unregistered'}</Text>
            </Text>
            <Text style={styles.clientDetailLine}>Contact No: {invoice.clientPhone || '-'}</Text>
            <Text style={styles.clientDetailLine}>Place of Supply: {invoice.placeOfSupply || '-'}</Text>
          </View>

          {/* Right: Invoice parameters */}
          <View style={styles.invoiceParamsBox}>
            <View style={styles.paramRow}>
              <Text style={styles.paramLabel}>Invoice No:</Text>
              <Text style={styles.paramValueBold}>{invoice.invoiceNo}</Text>
            </View>
            <View style={styles.paramRow}>
              <Text style={styles.paramLabel}>Invoice Date:</Text>
              <Text style={styles.paramValue}>{formatDate(invoice.invoiceDate)}</Text>
            </View>
            <View style={styles.paramRow}>
              <Text style={styles.paramLabel}>Payment Mode:</Text>
              <Text style={styles.paramValue}>{invoice.paymentMethod || 'Bank Transfer'}</Text>
            </View>
            <View style={styles.paramRow}>
              <Text style={styles.paramLabel}>L.R. No:</Text>
              <Text style={styles.paramValue}>{invoice.lrNo || '-'}</Text>
            </View>
            <View style={styles.paramRow}>
              <Text style={styles.paramLabel}>Vehicle No:</Text>
              <Text style={styles.paramValue}>{invoice.vehicleNo || '-'}</Text>
            </View>
            <View style={styles.paramRow}>
              <Text style={styles.paramLabel}>Reverse Charge:</Text>
              <Text style={styles.paramValue}>{invoice.reverseCharge || 'No'}</Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, { width: 35, textAlign: 'center' }]}>S.N</Text>
            <Text style={[styles.th, { flex: 2, textAlign: 'left', paddingLeft: 6 }]}>
              Description of Goods / Services
            </Text>
            <Text style={[styles.th, { width: 65, textAlign: 'center' }]}>HSN/SAC</Text>
            <Text style={[styles.th, { width: 45, textAlign: 'center' }]}>Qty</Text>
            <Text style={[styles.th, { width: 75, textAlign: 'right' }]}>Rate</Text>
            <Text style={[styles.th, { width: 85, textAlign: 'right', paddingRight: 6 }]}>Amount</Text>
          </View>

          {invoice.items.map((it, idx) => (
            <View key={it.id || idx} style={styles.tableRow}>
              <Text style={[styles.td, { width: 35, textAlign: 'center' }]}>{idx + 1}</Text>
              <Text style={[styles.td, { flex: 2, textAlign: 'left', paddingLeft: 6, fontWeight: '600' }]}>
                {it.particulars}
              </Text>
              <Text style={[styles.td, { width: 65, textAlign: 'center', fontFamily: 'monospace' }]}>
                {it.hsnCode || '-'}
              </Text>
              <Text style={[styles.td, { width: 45, textAlign: 'center' }]}>{it.quantity}</Text>
              <Text style={[styles.td, { width: 75, textAlign: 'right' }]}>
                {formatCurrency(it.rate)}
              </Text>
              <Text style={[styles.td, { width: 85, textAlign: 'right', paddingRight: 6, fontWeight: '700' }]}>
                {formatCurrency(it.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals Section & Bank details */}
        <View style={styles.totalsSplit}>
          <View style={styles.bankBox}>
            <Text style={styles.bankTitle}>Bank Account Details for Payment:</Text>
            <Text style={styles.bankLine}>Bank Name: <Text style={styles.boldText}>{company.bankName}</Text></Text>
            <Text style={styles.bankLine}>Branch: {company.branch}</Text>
            <Text style={styles.bankLine}>A/C No: <Text style={[styles.boldText, { fontFamily: 'monospace' }]}>{company.accountNo}</Text></Text>
            <Text style={styles.bankLine}>IFSC: <Text style={[styles.boldText, { fontFamily: 'monospace' }]}>{company.ifscCode}</Text></Text>
          </View>

          <View style={styles.summaryTable}>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>Subtotal:</Text>
              <Text style={styles.sumVal}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>CGST ({invoice.cgstRate}%):</Text>
              <Text style={styles.sumVal}>{formatCurrency(invoice.cgstAmount)}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text style={styles.sumLabel}>SGST ({invoice.sgstRate}%):</Text>
              <Text style={styles.sumVal}>{formatCurrency(invoice.sgstAmount)}</Text>
            </View>
            <View style={[styles.sumRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total Amount:</Text>
              <Text style={styles.grandTotalVal}>{formatCurrency(invoice.totalAmount)}</Text>
            </View>
          </View>
        </View>

        {/* Amount in words */}
        <View style={styles.wordsContainer}>
          <Text style={styles.wordsLabel}>Amount Chargeable (in words):</Text>
          <Text style={styles.wordsValue}>{invoice.amountInWords}</Text>
        </View>

        {/* Footer: Terms & Signature */}
        <View style={styles.paperFooter}>
          <View style={styles.termsBox}>
            <Text style={styles.termsTitle}>Terms & Conditions:</Text>
            <Text style={styles.termsContent}>{company.terms}</Text>
          </View>

          <View style={styles.signBox}>
            <Text style={styles.forCompany}>For {company.name}</Text>
            <View style={styles.signatureSpace} />
            <Text style={styles.signLabel}>Authorized Signatory</Text>
          </View>
        </View>
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
    gap: spacing.md,
    alignItems: 'center'
  },
  controlPanel: {
    width: '100%',
    maxWidth: 820,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  backBtnText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 12
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  editBtn: {
    backgroundColor: colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6
  },
  shareBtn: {
    backgroundColor: colors.info,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6
  },
  printBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12
  },
  paper: {
    width: '100%',
    maxWidth: 820,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#000000',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4
  },
  paperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1.5,
    borderBottomColor: '#000000',
    backgroundColor: '#FFFFFF'
  },
  companyCol: {
    flex: 1,
    marginRight: spacing.md
  },
  companyTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  companySub: {
    fontSize: 11,
    color: '#222222',
    lineHeight: 15
  },
  companyMeta: {
    fontSize: 10,
    color: '#333333',
    marginTop: 2
  },
  badgeCol: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  originalBadge: {
    borderWidth: 1,
    borderColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#F8FAFC'
  },
  originalBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000000'
  },
  invoiceMetaSub: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 3
  },
  titleBanner: {
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000000',
    paddingVertical: 6,
    alignItems: 'center'
  },
  titleBannerText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#000000'
  },
  metaGrid: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000000'
  },
  clientBox: {
    flex: 1,
    padding: spacing.md,
    borderRightWidth: 1.5,
    borderRightColor: '#000000',
    gap: 2
  },
  boxTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 4,
    textDecorationLine: 'underline'
  },
  clientNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000'
  },
  clientAddressText: {
    fontSize: 11,
    color: '#333333',
    lineHeight: 14,
    marginVertical: 2
  },
  clientDetailLine: {
    fontSize: 10.5,
    color: '#222222'
  },
  invoiceParamsBox: {
    flex: 1,
    padding: spacing.md,
    gap: 3
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1
  },
  paramLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#333333'
  },
  paramValue: {
    fontSize: 10.5,
    color: '#000000'
  },
  paramValueBold: {
    fontSize: 11.5,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: '#000000'
  },
  boldText: {
    fontWeight: '700'
  },
  table: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#000000'
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingVertical: 5
  },
  th: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000000'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 6
  },
  td: {
    fontSize: 10.5,
    color: '#000000'
  },
  totalsSplit: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000000'
  },
  bankBox: {
    flex: 1.1,
    padding: spacing.md,
    borderRightWidth: 1.5,
    borderRightColor: '#000000',
    gap: 2
  },
  bankTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 2
  },
  bankLine: {
    fontSize: 10,
    color: '#222222'
  },
  summaryTable: {
    flex: 0.9,
    padding: spacing.md,
    gap: 3
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2
  },
  sumLabel: {
    fontSize: 10.5,
    color: '#333333'
  },
  sumVal: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#000000'
  },
  grandTotalRow: {
    borderTopWidth: 1.5,
    borderTopColor: '#000000',
    paddingTop: 6,
    marginTop: 2
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000000'
  },
  grandTotalVal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#000000'
  },
  wordsContainer: {
    padding: spacing.md,
    borderBottomWidth: 1.5,
    borderBottomColor: '#000000',
    backgroundColor: '#F8FAFC'
  },
  wordsLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase'
  },
  wordsValue: {
    fontSize: 11,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#000000',
    marginTop: 2
  },
  paperFooter: {
    flexDirection: 'row',
    padding: spacing.md
  },
  termsBox: {
    flex: 1.2,
    marginRight: spacing.md
  },
  termsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 2
  },
  termsContent: {
    fontSize: 8.5,
    color: '#444444',
    lineHeight: 12
  },
  signBox: {
    flex: 0.8,
    alignItems: 'flex-end',
    justifyContent: 'space-between'
  },
  forCompany: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#000000'
  },
  signatureSpace: {
    height: 40
  },
  signLabel: {
    fontSize: 9,
    borderTopWidth: 1,
    borderTopColor: '#999999',
    borderStyle: 'dashed',
    paddingTop: 3,
    color: '#333333'
  }
});
