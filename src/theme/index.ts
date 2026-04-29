// Ember & Oak — steakhouse theme (default)
export const colors = {
  // Brand
  primary: '#8B1A1A',       // deep oxblood
  primaryLight: '#A52020',
  primaryDark: '#6B1414',
  accent: '#C9963C',         // brass/gold
  accentLight: '#D4A84B',

  // Canvas
  canvas: '#F7F3EE',        // warm cream
  canvasAlt: '#EDE8E1',
  surface: '#FFFFFF',
  surfaceAlt: '#FAF8F5',

  // Text
  ink: '#1B1612',
  inkMid: '#4A3F35',
  inkSub: '#7A6E65',
  inkPlaceholder: '#ADA49B',

  // Semantic
  success: '#2E7D32',
  successBg: '#E8F5E9',
  warning: '#E65100',
  warningBg: '#FFF3E0',
  error: '#C62828',
  errorBg: '#FFEBEE',
  info: '#1565C0',
  infoBg: '#E3F2FD',

  // UI
  border: '#E5DFD8',
  borderMid: '#C8C0B8',
  divider: '#EDE8E1',
  overlay: 'rgba(27, 22, 18, 0.5)',
  overlayLight: 'rgba(27, 22, 18, 0.08)',

  // Static
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Loyalty tiers
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
};

export const typography = {
  // Font families
  sans: 'Inter',
  serif: 'Fraunces',

  // Sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 38,

  // Weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,

  // Line heights
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
  giant: 64,
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const shadow = {
  sm: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const statusBarStyle = 'dark-content' as const;
