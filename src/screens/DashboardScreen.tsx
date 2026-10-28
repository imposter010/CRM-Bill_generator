import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { StatCard } from '../components/StatCard';
import { colors, spacing } from '../theme';
import { ActiveScreen, Invoice } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface DashboardScreenProps {
  invoices: Invoice[];
  clientCount: number;
  onNavigate: (screen: ActiveScreen) => void;
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onNewInvoice: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  invoices,
  clientCount,
  onNavigate,
  onViewInvoice,
  onEditInvoice,
  onNewInvoice
}) => {
  // Compute metrics
  const activeInvoices = invoices.filter(inv => inv.status !== 'cancelled');
  const totalBilled = activeInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPending = invoices
    .filter(inv => inv.status === 'draft' || inv.status === 'sent')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const recentInvoices = invoices.slice(0, 6);

  const getStatusBadge = (status: string) => {
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Quick Action Banner */}
      <View style={styles.banner}>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>Welcome to NA NATURAL AIR CONDITION®</Text>
          <Text style={styles.bannerSubtitle}>
            GST Tax Invoicing & Billing CRM • {invoices.length} Invoices • {clientCount} Registered Clients
          </Text>
        </View>
        <TouchableOpacity style={styles.bannerBtn} onPress={onNewInvoice} activeOpacity={0.8}>
          <Ionicons name="add-circle" size={18} color="#FFFFFF" />
          <Text style={styles.bannerBtnText}>Create Invoice</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Billed"
          value={formatCurrency(totalBilled)}
          icon="wallet-outline"
          colorType="primary"
          subtitle="All active invoices"
        />
        <StatCard
          title="Total Collected"
          value={formatCurrency(totalPaid)}
          icon="checkmark-circle-outline"
          colorType="success"
          subtitle="Realized revenue"
        />
        <StatCard
          title="Pending Dues"
          value={formatCurrency(totalPending)}
          icon="hourglass-outline"
          colorType="warning"
          subtitle="Draft & sent bills"
        />
        <StatCard
          title="Invoices Issued"
          value={String(invoices.length)}
          icon="receipt-outline"
          colorType="info"
          subtitle={`${clientCount} active clients`}
        />
      </View>

      {/* Quick Actions Shortcuts */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>

      <View style={styles.quickActionsRow}>
        <TouchableOpacity style={styles.quickActionBtn} onPress={onNewInvoice}>
          <View style={[styles.quickIconCircle, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="document-text" size={20} color={colors.primary} />
          </View>
          <Text style={styles.quickActionLabel}>New Invoice</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionBtn} onPress={() => onNavigate('clients')}>
          <View style={[styles.quickIconCircle, { backgroundColor: colors.successMuted }]}>
            <Ionicons name="person-add" size={20} color={colors.success} />
          </View>
          <Text style={styles.quickActionLabel}>Add Client</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionBtn} onPress={() => onNavigate('invoices')}>
          <View style={[styles.quickIconCircle, { backgroundColor: colors.infoMuted }]}>
            <Ionicons name="list" size={20} color={colors.info} />
          </View>
          <Text style={styles.quickActionLabel}>All Invoices</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickActionBtn} onPress={() => onNavigate('settings')}>
          <View style={[styles.quickIconCircle, { backgroundColor: colors.warningMuted }]}>
            <Ionicons name="business" size={20} color={colors.warning} />
          </View>
          <Text style={styles.quickActionLabel}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Invoices Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Recent Invoices</Text>
          </View>
          <TouchableOpacity onPress={() => onNavigate('invoices')}>
            <Text style={styles.viewAllText}>View All ({invoices.length}) →</Text>
          </TouchableOpacity>
        </View>

        {recentInvoices.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>No invoices created yet.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={onNewInvoice}>
              <Text style={styles.emptyBtnText}>Create First Invoice</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.invoicesList}>
            {recentInvoices.map(inv => {
              const badge = getStatusBadge(inv.status);
              return (
                <View key={inv.id} style={styles.invoiceRow}>
                  <View style={styles.invoiceInfo}>
                    <View style={styles.invoiceTopLine}>
                      <Text style={styles.invoiceNo}>{inv.invoiceNo}</Text>
                      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                      </View>
                    </View>
                    <Text style={styles.clientName} numberOfLines={1}>{inv.clientName}</Text>
                    <Text style={styles.invoiceDate}>{formatDate(inv.invoiceDate)}</Text>
                  </View>

                  <View style={styles.invoiceRight}>
                    <Text style={styles.invoiceAmount}>{formatCurrency(inv.totalAmount)}</Text>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.smallBtn, { backgroundColor: colors.primaryMuted }]}
                        onPress={() => onViewInvoice(inv)}
                      >
                        <Ionicons name="print-outline" size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.smallBtn, { backgroundColor: colors.surfaceHover }]}
                        onPress={() => onEditInvoice(inv)}
                      >
                        <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
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
    padding: spacing.lg,
    paddingBottom: 40
  },
  banner: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  bannerText: {
    flex: 1,
    minWidth: 240
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  bannerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4
  },
  bannerBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: 8
  },
  bannerBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm + 2,
    justifyContent: 'space-between',
    marginBottom: spacing.lg
  },
  sectionHeader: {
    marginBottom: spacing.sm
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
    flexWrap: 'wrap'
  },
  quickActionBtn: {
    flex: 1,
    minWidth: 75,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  quickIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxl
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.sm
  },
  emptyBtn: {
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: spacing.md
  },
  emptyBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13
  },
  invoicesList: {
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  invoiceInfo: {
    flex: 1,
    marginRight: spacing.md
  },
  invoiceTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2
  },
  invoiceNo: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: colors.textPrimary
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  clientName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary
  },
  invoiceDate: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  invoiceRight: {
    alignItems: 'flex-end',
    gap: 6
  },
  invoiceAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6
  },
  smallBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
