// lib/design-tokens.ts
export const COLORS = {
  bg: "#FAFAF8",
  text: "#1A1A1A",
  muted: "#6B6B6B",
  subtle: "#9A9A9A",
  border: "#E5E5E2",
  borderStrong: "#1A1A1A",
  surface: "#FFFFFF",
  danger: "#C0392B",
  dangerBg: "#FEF5F4",
} as const;

export const SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADII = {
  card: 8,
  button: 8,
  input: 8,
  small: 6,
} as const;

export const FONT = {
  size: { h1: 28, h2: 18, h3: 15, body: 14, small: 13, caption: 12 },
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  lineHeight: { tight: 1.25, normal: 1.6, loose: 1.8 },
} as const;
