/**
 * Material Design 3 Spacing Constants
 * Based on MD3's 8dp grid system
 * 
 * Padding is measured in increments of 4dp per MD3 specifications.
 * Reference: https://m3.material.io/foundations/layout/understanding-layout/spacing
 * 
 * Spacers (space between panes) measure 24dp wide per MD3 specifications.
 * Reference: https://m3.material.io/foundations/layout/understanding-layout/spacing
 */

export const SPACING = {
  // Extra small - 4dp (0.5x base unit)
  // MD3: Padding is measured in increments of 4dp
  // Reference: https://m3.material.io/foundations/layout/understanding-layout/spacing
  xs: 4,

  // Small - 8dp (1x base unit)
  // MD3: Base unit of the 8dp grid system
  // Reference: https://m3.material.io/foundations/layout/understanding-layout/spacing
  sm: 8,

  // Medium - 12dp (1.5x base unit)
  // MD3: 1.5x the base 8dp unit
  // Reference: https://m3.material.io/foundations/layout/understanding-layout/spacing
  md: 12,

  // Base - 16dp (2x base unit, most common)
  // MD3: 2x the base 8dp unit, commonly used for card padding
  // Reference: https://m3.material.io/foundations/layout/understanding-layout/spacing
  base: 16,

  // Large - 24dp (3x base unit)
  // MD3: Spacers between panes measure 24dp wide
  // Reference: https://m3.material.io/foundations/layout/understanding-layout/spacing
  lg: 24,

  // Extra large - 32dp (4x base unit)
  // MD3: 4x the base 8dp unit
  // Reference: https://m3.material.io/foundations/layout/understanding-layout/spacing
  xl: 32,

  // 2x Extra large - 48dp (6x base unit)
  // MD3: 6x the base 8dp unit
  // Reference: https://m3.material.io/foundations/layout/understanding-layout/spacing
  xxl: 48,

  // 3x Extra large - 64dp (8x base unit)
  // MD3: 8x the base 8dp unit
  // Reference: https://m3.material.io/foundations/layout/understanding-layout/spacing
  xxxl: 64,
} as const;

/**
 * Component-specific height constants
 * Based on Material Design 3 specifications
 * 
 * Note: Tab height (48dp) and icon button size (48dp) use SPACING.xxl
 * These are kept separate for semantic clarity and component-specific documentation
 */
export const HEIGHTS = {
  // Search Bar Height
  // MD3: Search bars use 56dp height
  // Reference: https://m3.material.io/components/search/specs
  searchBar: 56, // 56dp

  // App Bar Height
  // MD3: Small/Center-aligned app bars use 64dp height
  // Reference: https://m3.material.io/components/app-bars/overview
  // Note: This equals SPACING.xxxl (64dp) but kept for semantic clarity
  appBar: 64, // 64dp (same as SPACING.xxxl)
} as const;
