/**
 * Unified Design Token System
 * Three-tier architecture: Primitive → Semantic → Component
 */

/* ─────────────────────────────────────────────────────────────────────────── */
/* PRIMITIVE TOKENS - Raw design values                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

export const PRIMITIVE = {
  // Color Palette
  colors: {
    // Neutrals - Light Mode
    neutral: {
      50: '#F9F9FB',
      100: '#F5F5F7',
      150: '#EEEEF0',
      200: '#E5E5E7',
      300: '#D5D5D7',
      400: '#A1A1A6',
      500: '#86868B',
      600: '#6E6E73',
      700: '#3A3A3C',
      800: '#1D1D1F',
      900: '#000000',
    },
    // Brand Blue
    blue: {
      50: '#EFF6FF',
      100: '#E0F2FE',
      200: '#BAE6FD',
      300: '#7DD3FC',
      400: '#38BDF8',
      500: '#0EA5E9',
      600: '#0284C7',
      700: '#0369A1',
      800: '#075985',
      900: '#0C4A6E',
      950: '#082F49',
      apple: '#007AFF', // Apple standard
    },
    // System Colors
    status: {
      success: '#34C759',
      warning: '#FF9500',
      danger: '#FF3B30',
      info: '#007AFF',
    },
    // Semantic backgrounds
    surface: {
      light: '#FFFFFF',
      dark: '#1A1A1A',
    },
  },

  // Spacing Scale (4pt base)
  spacing: {
    0: '0',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
  },

  // Typography
  typography: {
    fontFamily: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "'Menlo', 'Monaco', 'Courier New', monospace",
    },
    fontSize: {
      xs: '12px',
      sm: '13px',
      base: '14px',
      md: '15px',
      lg: '16px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px',
      '4xl': '28px',
      '5xl': '32px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.2,
      snug: 1.4,
      normal: 1.5,
      relaxed: 1.6,
      loose: 1.8,
    },
    letterSpacing: {
      tight: '-0.022em',
      normal: '-0.011em',
      loose: '0em',
    },
  },

  // Border Radius
  radius: {
    none: '0',
    sm: '6px',
    base: '8px',
    md: '12px',
    lg: '16px',
    xl: '18px',
    '2xl': '24px',
    full: '9999px',
  },

  // Shadows - Depth Scale
  shadows: {
    none: 'none',
    // Subtle elevation
    xs: '0 1px 2px rgba(0, 0, 0, 0.02), 0 1px 4px rgba(0, 0, 0, 0.02)',
    sm: '0 2px 4px rgba(0, 0, 0, 0.03), 0 2px 6px rgba(0, 0, 0, 0.02)',
    // Standard elevation
    base: '0 4px 12px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.02)',
    md: '0 8px 20px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.02)',
    // High elevation
    lg: '0 12px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.04)',
    xl: '0 20px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)',
    // Modal/Overlay
    overlay: '0 25px 50px rgba(0, 0, 0, 0.15)',
  },

  // Z-Index Scale
  zIndex: {
    base: 0,
    sticky: 10,
    dropdown: 20,
    sidebarNav: 30,
    overlay: 40,
    modal: 50,
    tooltip: 60,
  },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* SEMANTIC TOKENS - Usage-based abstraction                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

export const SEMANTIC = {
  // Background Colors
  background: {
    primary: PRIMITIVE.colors.neutral[100],
    secondary: PRIMITIVE.colors.neutral[50],
    tertiary: PRIMITIVE.colors.neutral[200],
    surface: PRIMITIVE.colors.surface.light,
    surfaceVariant: PRIMITIVE.colors.neutral[100],
    elevated: PRIMITIVE.colors.surface.light,
  },

  // Text Colors
  text: {
    primary: PRIMITIVE.colors.neutral[800],
    secondary: PRIMITIVE.colors.neutral[500],
    tertiary: PRIMITIVE.colors.neutral[400],
    inverse: PRIMITIVE.colors.surface.light,
    disabled: PRIMITIVE.colors.neutral[300],
  },

  // Border Colors
  border: {
    default: PRIMITIVE.colors.neutral[200],
    subtle: PRIMITIVE.colors.neutral[100],
    strong: PRIMITIVE.colors.neutral[300],
  },

  // Interactive Colors
  interactive: {
    primary: PRIMITIVE.colors.blue.apple,
    primaryHover: '#0062CC',
    primaryActive: '#0051B3',
    secondary: PRIMITIVE.colors.neutral[200],
    secondaryHover: PRIMITIVE.colors.neutral[300],
    tertiary: PRIMITIVE.colors.neutral[100],
    disabled: PRIMITIVE.colors.neutral[300],
  },

  // Status Colors
  status: {
    success: PRIMITIVE.colors.status.success,
    warning: PRIMITIVE.colors.status.warning,
    danger: PRIMITIVE.colors.status.danger,
    info: PRIMITIVE.colors.status.info,
  },

  // Shadow Elevation
  shadow: {
    elevation1: PRIMITIVE.shadows.xs,
    elevation2: PRIMITIVE.shadows.sm,
    elevation3: PRIMITIVE.shadows.base,
    elevation4: PRIMITIVE.shadows.md,
    elevation5: PRIMITIVE.shadows.lg,
  },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* COMPONENT TOKENS - Component-specific overrides                            */
/* ─────────────────────────────────────────────────────────────────────────── */

export const COMPONENTS = {
  button: {
    height: {
      sm: '32px',
      base: '40px',
      lg: '48px',
    },
    padding: {
      sm: '0 12px',
      base: '0 16px',
      lg: '0 24px',
    },
    radius: PRIMITIVE.radius.lg,
    focusRing: {
      width: '2px',
      color: PRIMITIVE.colors.blue.apple,
      offset: '2px',
    },
  },

  input: {
    height: '40px',
    padding: '0 12px',
    radius: PRIMITIVE.radius.base,
    borderWidth: '1px',
    focusRing: {
      width: '2px',
      color: PRIMITIVE.colors.blue.apple,
      offset: '2px',
    },
  },

  card: {
    padding: PRIMITIVE.spacing[6],
    radius: PRIMITIVE.radius.lg,
    border: `1px solid ${PRIMITIVE.colors.neutral[100]}`,
    shadow: PRIMITIVE.shadows.base,
  },

  modal: {
    maxWidth: '500px',
    radius: PRIMITIVE.radius.xl,
    shadow: PRIMITIVE.shadows.overlay,
    backdropBlur: 'blur(12px)',
  },

  sidebar: {
    width: '260px',
    collapsedWidth: '80px',
  },

  header: {
    height: '64px',
  },
};

/* ─────────────────────────────────────────────────────────────────────────── */
/* DARK MODE TOKENS - Override for dark color scheme                          */
/* ─────────────────────────────────────────────────────────────────────────── */

export const DARK_MODE = {
  background: {
    primary: '#1A1A1A',
    secondary: '#262626',
    tertiary: '#404040',
    surface: '#1A1A1A',
    surfaceVariant: '#262626',
    elevated: '#2A2A2A',
  },

  text: {
    primary: '#F5F5F7',
    secondary: '#A1A1A6',
    tertiary: '#86868B',
    inverse: '#1A1A1A',
    disabled: '#595959',
  },

  border: {
    default: '#404040',
    subtle: '#2A2A2A',
    strong: '#595959',
  },

  interactive: {
    primary: PRIMITIVE.colors.blue.apple,
    primaryHover: '#0A88FF',
    primaryActive: '#0062CC',
    secondary: '#404040',
    secondaryHover: '#595959',
    tertiary: '#262626',
    disabled: '#404040',
  },

  // Shadows darker in dark mode
  shadow: {
    elevation1: '0 1px 2px rgba(0, 0, 0, 0.3)',
    elevation2: '0 2px 4px rgba(0, 0, 0, 0.4)',
    elevation3: '0 4px 12px rgba(0, 0, 0, 0.5)',
    elevation4: '0 8px 20px rgba(0, 0, 0, 0.6)',
    elevation5: '0 12px 32px rgba(0, 0, 0, 0.7)',
  },
};

export default PRIMITIVE;
