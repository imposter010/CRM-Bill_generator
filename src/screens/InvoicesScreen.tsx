import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
import { Invoice, InvoiceStatus } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface InvoicesScreenProps {
  invoices: Invoice[];
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onUpdateStatus: (id: string, status: InvoiceStatus) => void;
  onNewInvoice: () => void;
}

export const InvoicesScreen: React.FC<InvoicesScreenProps> = ({
  invoices,
  onViewInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onUpdateStatus,
  onNewInvoice
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all');

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.clientGstin && inv.clientGstin.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return { label: 'Paid', color: colors.success, bg: colors.successMuted };
      case 'sent':
        return { label: 'Sent', color: colors.info, bg: colors.infoMuted };
      case 'cancelled':
        return { label: 'Cancelled', color: colors.danger, bg: colors.dangerMuted };
      default:
        return { label: 'Draft', color: colors.warning, bg: colors.warningMuted };
    }
  };

  const handleDelete = (inv: Invoice) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete invoice ${inv.invoiceNo}?`)) {
        onDeleteInvoice(inv.id);
      }
    } else {
      Alert.alert(
        'Delete Invoice',
        `Are you sure you want to permanently delete invoice ${inv.invoiceNo}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => onDeleteInvoice(inv.id) }
        ]
      );
    }
  };

  const tabs: { key: 'all' | InvoiceStatus; label: string }[] = [
    { key: 'all', label: `All (${invoices.length})` },
    { key: 'paid', label: `Paid (${invoices.filter(i => i.status === 'paid').length})` },
    { key: 'sent', label: `Sent (${invoices.filter(i => i.status === 'sent').length})` },
    { key: 'draft', label: `Draft (${invoices.filter(i => i.status === 'draft').length})` },
    { key: 'cancelled', label: `Cancelled (${invoices.filter(i => i.status === 'cancelled').length})` }
  ];

  return (
    <View style={styles.container}>
      {/* Search Bar & New Button */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by invoice #, client name, GSTIN..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={onNewInvoice} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Status Tabs Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContainer}
      >
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabChip, statusFilter === tab.key && styles.activeTabChip]}
            onPress={() => setStatusFilter(tab.key)}
          >
            <Text
              style={[styles.tabChipText, statusFilter === tab.key && styles.activeTabChipText]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Invoices List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filteredInvoices.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Invoices Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or status filter.'
                : 'Get started by creating your first GST tax invoice.'}
            </Text>
            <TouchableOpacity style={styles.emptyActionBtn} onPress={onNewInvoice}>
              <Text style={styles.emptyActionBtnText}>Create New Invoice</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredInvoices.map(inv => {
            const badge = getStatusBadge(inv.status);
            const totalTax = inv.cgstAmount + inv.sgstAmount;

            return (
              <View key={inv.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View>
                    <View style={styles.noAndBadge}>
                      <Text style={styles.invoiceNo}>{inv.invoiceNo}</Text>
                      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.clientName}>{inv.clientName}</Text>
                    {inv.clientGstin ? (
                      <Text style={styles.gstinText}>GSTIN: {inv.clientGstin}</Text>
                    ) : null}
                  </View>

                  <View style={styles.amountBox}>
                    <Text style={styles.totalAmount}>{formatCurrency(inv.totalAmount)}</Text>
                    <Text style={styles.taxSubtext}>
                      Sub: {formatCurrency(inv.subtotal)} • Tax: {formatCurrency(totalTax)}
                    </Text>
                  </View>
                </View>

                {/* Items preview snippet */}
                <View style={styles.itemsPreview}>
                  <Text style={styles.itemsPreviewText} numberOfLines={1}>
                    📦 {inv.items.length} Item(s): {inv.items.map(it => it.particulars).join(', ')}
                  </Text>
                </View>

                <View style={styles.cardBottom}>
                  <View style={styles.metaLeft}>
                    <Text style={styles.dateText}>
                      <Ionicons name="calendar-outline" size={13} color={colors.textMuted} /> {formatDate(inv.invoiceDate)}
                    </Text>
                    {inv.paymentMethod ? (
                      <Text style={styles.paymentText}>• {inv.paymentMethod}</Text>
                    ) : null}
                  </View>

                  {/* Actions Bar */}
                  <View style={styles.cardActions}>
                    {/* Status quick toggle */}
                    <TouchableOpacity
                      style={styles.statusToggleBtn}
                      onPress={() => {
                        const nextStatus: Record<InvoiceStatus, InvoiceStatus> = {
                          draft: 'sent',
                          sent: 'paid',
                          paid: 'draft',
                          cancelled: 'draft'
                        };
                        onUpdateStatus(inv.id, nextStatus[inv.status]);
                      }}
                    >
                      <Ionicons name="sync-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.statusToggleText}>Status</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.primaryMuted }]}
                      onPress={() => onViewInvoice(inv)}
                    >
                      <Ionicons name="print-outline" size={16} color={colors.primary} />
                      <Text style={[styles.actionBtnText, { color: colors.primary }]}>Print / PDF</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.surfaceHover }]}
                      onPress={() => onEditInvoice(inv)}
                    >
                      <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: colors.dangerMuted }]}
                      onPress={() => handleDelete(inv)}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  searchContainer: {
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13
  },
  createBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    justifyContent: 'center'
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  tabsScroll: {
    maxHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface
  },
  tabsContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center'
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border
  },
  activeTabChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  activeTabChipText: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  list: {
    flex: 1
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: spacing.md
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xxxl,
    marginTop: 40
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: 280
  },
  emptyActionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: spacing.lg
  },
  emptyActionBtnText: {
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
    gap: spacing.sm
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  noAndBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  invoiceNo: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: colors.textPrimary
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  clientName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  gstinText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.textMuted,
    marginTop: 2
  },
  amountBox: {
    alignItems: 'flex-end'
  },
  totalAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary
  },
  taxSubtext: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  itemsPreview: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderLight
  },
  itemsPreviewText: {
    fontSize: 12,
    color: colors.textSecondary
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  dateText: {
    fontSize: 12,
    color: colors.textMuted
  },
  paymentText: {
    fontSize: 12,
    color: colors.textMuted
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  statusToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6
  },
  statusToggleText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600'
  }
});
