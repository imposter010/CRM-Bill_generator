import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing } from '../theme';
import { ActiveScreen, CompanySettings } from '../types';

interface HeaderProps {
  currentScreen: ActiveScreen;
  company: CompanySettings;
  onNavigate: (screen: ActiveScreen) => void;
  onNewInvoice: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  company,
  onNavigate,
  onNewInvoice
}) => {
  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'dashboard':
        return 'Dashboard Overview';
      case 'invoices':
        return 'Tax Invoices';
      case 'invoice-create':
        return 'Create Tax Invoice';
      case 'invoice-edit':
        return 'Edit Tax Invoice';
      case 'invoice-view':
        return 'Tax Invoice Preview';
      case 'clients':
        return 'Client Management';
      case 'settings':
        return 'Company & System Settings';
      default:
        return 'Bill Generator';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.brandBadge}>
          <Ionicons name="receipt" size={18} color="#FFFFFF" />
        </View>
        <View>
          <Text style={styles.companyName} numberOfLines={1}>
            {company.name || 'NA NATURAL AIR CONDITION'}
          </Text>
          <Text style={styles.screenTitle}>{getScreenTitle()}</Text>
        </View>
      </View>

      <View style={styles.right}>
        {currentScreen !== 'invoice-create' && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onNewInvoice}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>New Invoice</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => onNavigate('settings')}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1
  },
  brandBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3
  },
  companyName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm
  },
  actionBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 8
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600'
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border
  }
});
