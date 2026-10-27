import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing } from '../theme';
import { ActiveScreen } from '../types';

interface BottomNavProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  const tabs: { key: ActiveScreen; label: string; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid' },
    { key: 'invoices', label: 'Invoices', icon: 'document-text-outline', activeIcon: 'document-text' },
    { key: 'invoice-create', label: 'New Bill', icon: 'add-circle-outline', activeIcon: 'add-circle' },
    { key: 'clients', label: 'Clients', icon: 'people-outline', activeIcon: 'people' },
    { key: 'settings', label: 'Settings', icon: 'options-outline', activeIcon: 'options' }
  ];

  return (
    <View style={styles.container}>
      {tabs.map(tab => {
        const isActive =
          currentScreen === tab.key ||
          (tab.key === 'invoices' && (currentScreen === 'invoice-edit' || currentScreen === 'invoice-view'));

        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onNavigate(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={22}
              color={isActive ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 6
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    minWidth: 58
  },
  activeTab: {
    backgroundColor: colors.primaryMuted
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 3
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: '700'
  }
});
