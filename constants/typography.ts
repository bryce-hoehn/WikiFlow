/**
 * Material Design 3 Typography Constants
 * Based on MD3's type scale specifications
 * 
 * Reference: https://m3.material.io/styles/typography/type-scale-tokens
 */

export const TYPOGRAPHY = {
  // App Bar Typography
  // MD3: Small and Center-aligned Top App Bars use 22sp for titles
  // Reference: https://m3.material.io/components/app-bars/overview
  appBarTitle: 22, // 22sp

  // Tab Typography
  // MD3: Tab labels use 14sp
  // Reference: https://m3.material.io/components/tabs/specs
  tabLabel: 14, // 14sp

  // Medium Top App Bar
  // MD3: Medium Top App Bar uses 24sp for titles
  // Reference: https://m3.material.io/components/app-bars/overview
  appBarTitleMedium: 24, // 24sp

  // Large Top App Bar
  // MD3: Large Top App Bar uses 28sp for titles
  // Reference: https://m3.material.io/components/app-bars/overview
  appBarTitleLarge: 28, // 28sp

  // Body Text
  // MD3: Body text typically uses 14sp (bodyMedium) or 16sp (bodyLarge)
  // Reference: https://m3.material.io/styles/typography/type-scale-tokens
  bodySmall: 12, // 12sp
  bodyMedium: 14, // 14sp
  bodyLarge: 16, // 16sp

  // Title Typography
  // MD3: Title variants use 14sp (titleSmall), 16sp (titleMedium), 22sp (titleLarge)
  // Reference: https://m3.material.io/styles/typography/type-scale-tokens
  titleSmall: 14, // 14sp
  titleMedium: 16, // 16sp
  titleLarge: 22, // 22sp

  // Headline Typography
  // MD3: Headline variants use 24sp (headlineSmall), 28sp (headlineMedium), 32sp (headlineLarge)
  // Reference: https://m3.material.io/styles/typography/type-scale-tokens
  headlineSmall: 24, // 24sp
  headlineMedium: 28, // 28sp
  headlineLarge: 32, // 32sp

  // Line Heights (common ratios)
  // MD3: Line heights are typically 1.2-1.5x the font size
  lineHeightTight: 1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.75,
} as const;

