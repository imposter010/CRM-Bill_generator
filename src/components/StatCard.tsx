import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../theme';

interface StatCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  colorType: 'primary' | 'success' | 'warning' | 'info';
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  colorType,
  subtitle
}) => {
  const getColor = () => {
    switch (colorType) {
      case 'success':
        return { main: colors.success, bg: colors.successMuted };
      case 'warning':
        return { main: colors.warning, bg: colors.warningMuted };
      case 'info':
        return { main: colors.info, bg: colors.infoMuted };
      default:
        return { main: colors.primary, bg: colors.primaryMuted };
    }
  };

  const scheme = getColor();

  return (
    <View style={[styles.card, { borderLeftColor: scheme.main }]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.value} numberOfLines={1}>{value}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={[styles.iconWrapper, { backgroundColor: scheme.bg }]}>
          <Ionicons name={icon} size={22} color={scheme.main} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.sm
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
