import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { colors, spacing } from '../theme';
import { ActiveScreen, CompanySettings } from '../types';

interface HeaderProps {
  currentScreen: ActiveScreen;
  company: CompanySettings;
  onNavigate: (screen: ActiveScreen) => void;
  onNewInvoice: () => void;
  onBack?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  company,
  onNavigate,
  onNewInvoice,
  onBack,
  onLogout
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 680;
  const isDashboard = currentScreen === 'dashboard';

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
        return 'Settings & Profile';
      default:
        return 'Bill Generator';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {!isDashboard && onBack ? (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={styles.brandBadge}>
            <Ionicons name="receipt" size={18} color="#FFFFFF" />
          </View>
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.companyName} numberOfLines={1}>
            {company.name || 'NA NATURAL AIR CONDITION'}
          </Text>
          <Text style={styles.screenTitle} numberOfLines={1}>
            {getScreenTitle()}
          </Text>
        </View>
      </View>

      <View style={styles.right}>
        {!isMobile && currentScreen !== 'invoice-create' && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onNewInvoice}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>New Invoice</Text>
          </TouchableOpacity>
        )}

        {currentScreen !== 'settings' && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => onNavigate('settings')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {onLogout && (
          <TouchableOpacity
            style={[styles.iconBtn, { borderColor: colors.dangerMuted }]}
            onPress={onLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    flex: 1,
    marginRight: spacing.sm
  },
  brandBadge: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  titleContainer: {
    flex: 1
  },
  companyName: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0
  },
  actionBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: 8
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
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
