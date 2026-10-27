export const colors = {
  // Backgrounds
  background: '#090D16',
  surface: '#111827',
  surfaceElevated: '#1E293B',
  surfaceHover: '#283548',
  
  // Borders
  border: '#334155',
  borderLight: '#1E293B',
  borderFocus: '#6366F1',

  // Primary Accent
  primary: '#6366F1',
  primaryHover: '#4F46E5',
  primaryMuted: 'rgba(99, 102, 241, 0.15)',

  // Status & Badges
  success: '#10B981',
  successMuted: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.15)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239, 68, 68, 0.15)',
  info: '#38BDF8',
  infoMuted: 'rgba(56, 189, 248, 0.15)',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0F172A',

  // Gradients
  gradientStart: '#1E293B',
  gradientEnd: '#0F172A',
  
  // Invoice paper theme (for print/preview)
  paperBg: '#FFFFFF',
  paperText: '#111827',
  paperBorder: '#E2E8F0',
  paperMuted: '#64748B',
  paperPrimary: '#1E293B'
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32
};

export const typography = {
  h1: { fontSize: 24, fontWeight: '700' as const, color: colors.textPrimary },
  h2: { fontSize: 18, fontWeight: '600' as const, color: colors.textPrimary },
  h3: { fontSize: 15, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 14, color: colors.textPrimary },
  bodySecondary: { fontSize: 13, color: colors.textSecondary },
  caption: { fontSize: 11, color: colors.textMuted },
  badge: { fontSize: 11, fontWeight: '600' as const },
};
