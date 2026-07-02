/**
 * HandyAi — Dark minimal palette
 * Inspired by ChatGPT dark + Linear's contrast discipline.
 * All colors are hex strings for StyleSheet usage.
 */
export const colors = {
  background: '#0E0E10',
  surface: '#18181B',
  surfaceVariant: '#27272A',
  border: '#27272A',
  borderStrong: '#3F3F46',

  text: '#FAFAFA',
  textMuted: '#A1A1AA',
  textSubtle: '#71717A',

  accent: '#6366F1',         // indigo-500
  accentHover: '#4F46E5',
  accentSoft: 'rgba(99, 102, 241, 0.15)',

  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',

  userBubble: '#6366F1',
  assistantBubble: '#27272A',

  overlay: 'rgba(0, 0, 0, 0.6)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 28,
} as const;

export const fontFamily = {
  body: 'System',
  mono: 'Menlo',
} as const;

export const layout = {
  maxContentWidth: 768,
  inputBarHeight: 60,
  headerHeight: 56,
} as const;

export type Theme = typeof colors;
