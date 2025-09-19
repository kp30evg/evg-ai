/**
 * EverCore Theme Configuration
 * Based on evergreenOS brand guidelines
 */

// Color System
export const colors = {
  // Primary Brand Colors
  evergreen: '#1D5238', // Primary brand color (not #10b981)
  charcoal: '#222B2E',
  white: '#FFFFFF',
  
  // Background Colors
  background: '#FAFBFC', // Light gray background
  surface: '#FFFFFF', // White for cards and surfaces
  
  // Secondary Colors
  mediumGray: '#6B7280',
  lightGray: '#E5E7EB',
  softGreen: '#E6F4EC',
  
  // Text Colors
  text: '#222B2E', // Primary text (charcoal)
  textSecondary: '#6B7280', // Secondary text (medium gray)
  textLight: '#9CA3AF', // Light text
  
  // Dark Mode Colors (for future use)
  darkBackground: '#111827', // gray-900
  darkSurface: '#1F2937', // gray-800
  darkBorder: '#374151', // gray-700
  darkText: '#F3F4F6', // gray-100
  darkTextSecondary: '#9CA3AF', // gray-400
  
  // Semantic Colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Stage Colors (for pipeline)
  stages: {
    prospecting: '#FFA500', // Orange
    qualification: '#FFD700', // Gold
    proposal: '#6B7280', // Gray
    negotiation: '#1D5238', // Evergreen
    closedWon: '#10B981', // Success green
    closedLost: '#EF4444', // Error red
  }
} as const

// Spacing System (base unit: 8px)
export const spacing = {
  xs: '4px',   // 0.5 unit
  sm: '8px',   // 1 unit
  md: '12px',  // 1.5 units
  lg: '16px',  // 2 units
  xl: '24px',  // 3 units
  '2xl': '32px', // 4 units
  '3xl': '48px', // 6 units
  '4xl': '64px', // 8 units
  '5xl': '96px', // 12 units
  '6xl': '128px', // 16 units
} as const

// Typography Scale
export const typography = {
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMono: '"SF Mono", "Monaco", "Cascadia Code", monospace',
  
  // Font Sizes
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
    '5xl': '48px',
  },
  
  // Line Heights
  lineHeight: {
    tight: '1.1',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  
  // Font Weights
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  }
} as const

// Border Radius System
export const borderRadius = {
  none: '0',
  sm: '4px',
  base: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  full: '9999px',
} as const

// Shadows
export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  base: '0 4px 16px rgba(0, 0, 0, 0.04)',
  md: '0 6px 24px rgba(0, 0, 0, 0.06)',
  lg: '0 12px 32px rgba(0, 0, 0, 0.08)',
  xl: '0 25px 70px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
} as const

// Breakpoints
export const breakpoints = {
  mobile: '0px',
  tablet: '768px',
  desktop: '1280px',
  wide: '1536px',
} as const

// Z-Index Scale
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  toast: 600,
  tooltip: 700,
} as const

// Animation Timings
export const transitions = {
  fast: '150ms ease-out',
  base: '200ms ease-out',
  medium: '300ms ease-out',
  slow: '500ms ease-out',
} as const

// Layout Constants
export const layout = {
  sidebarCollapsedWidth: '64px',
  sidebarExpandedWidth: '240px',
  commandBarHeight: '56px',
  headerHeight: '64px',
  maxContentWidth: '1400px',
} as const

// Export complete theme object
export const theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  breakpoints,
  zIndex,
  transitions,
  layout,
} as const

export type Theme = typeof theme