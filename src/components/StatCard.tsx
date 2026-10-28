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
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text
            style={styles.value}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {value}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={[styles.iconWrapper, { backgroundColor: scheme.bg }]}>
          <Ionicons name={icon} size={20} color={scheme.main} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    maxWidth: '50%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: spacing.md - 2,
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
    marginRight: 6
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4
  },
  value: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary
  },
  subtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  }
});
