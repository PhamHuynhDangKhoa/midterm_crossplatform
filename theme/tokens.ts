import { TextStyle } from 'react-native';

// Dealt via tasteskill start.mjs (palette: mint-pink-accounts, radius: soft)
export const palette = {
  bg: '#f8f8f8',
  surface: '#eeeeee',
  card: '#ffffff',
  ink: '#0a0a0a',
  muted: '#6a6a6a',
  accent: '#1f6b3a',
  accentInk: '#ffffff',
  mint: '#c3edce',
  pink: '#f8c7c9',
  butter: '#f4e9c8',
  sky: '#d7eaf7',
  hairline: '#ebebea',
  danger: '#c9332b',
  dangerTint: '#fbe9e8',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  gutter: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

export const typeScale: Record<string, TextStyle> = {
  heroTitle: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.8,
    lineHeight: 34,
    color: palette.ink,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.4,
    lineHeight: 26,
    color: palette.ink,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: palette.ink,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 23,
    color: palette.ink,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.ink,
  },
  meta: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    color: palette.muted,
  },
  number: {
    fontVariant: ['tabular-nums'],
  },
};

const PASTEL_SWATCHES = [
  palette.mint,
  palette.pink,
  palette.butter,
  palette.sky,
] as const;

export function getTypeSwatch(typeName: string): string {
  const clean = typeName.trim().toLowerCase();
  if (!clean) return palette.mint;
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = Math.trunc(hash * 31 + (clean.codePointAt(i) ?? 0));
  }
  return PASTEL_SWATCHES[Math.abs(hash) % PASTEL_SWATCHES.length];
}

export function formatVnd(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `${new Intl.NumberFormat('de-DE').format(safe)} ₫`;
}
