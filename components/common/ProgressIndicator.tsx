import React from 'react';
import { View } from 'react-native';
import { ProgressBar, Text, useTheme } from 'react-native-paper';
import { SPACING } from '../../constants/spacing';

interface ProgressIndicatorProps {
  /**
   * Progress value between 0 and 1
   */
  progress: number;
  /**
   * Optional message to display
   */
  message?: string;
  /**
   * Whether to show percentage
   */
  showPercentage?: boolean;
  /**
   * Optional cancel handler
   */
  onCancel?: () => void;
}

/**
 * Unified progress indicator component for long-running operations
 * Shows progress bar with optional message and percentage
 */
export default function ProgressIndicator({
  progress,
  message,
  showPercentage = false,
  onCancel,
}: ProgressIndicatorProps) {
  const theme = useTheme();

  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const percentage = Math.round(clampedProgress * 100);

  return (
    <View
      style={{
        padding: SPACING.base + SPACING.xs, // M3: 20dp padding (16dp + 4dp)
        backgroundColor: theme.colors.surface,
        borderRadius: theme.roundness,
        minWidth: 300,
        maxWidth: 500,
      }}
    >
      {message && (
        <Text
          variant="bodyMedium"
          style={{
            marginBottom: SPACING.base, // M3: 16dp spacing
            color: theme.colors.onSurface,
            textAlign: 'center',
          }}
        >
          {message}
        </Text>
      )}

      <View style={{ marginBottom: SPACING.sm }}> {/* M3: 8dp spacing */}
        <ProgressBar
          progress={clampedProgress}
          color={theme.colors.primary}
          style={{ height: 4, borderRadius: 2 }} // M3: Progress bar height is 4dp, corner radius is 2dp (half of height)
        />
      </View>

      {showPercentage && (
        <Text
          variant="bodySmall"
          style={{
            color: theme.colors.onSurfaceVariant,
            textAlign: 'center',
          }}
        >
          {percentage}%
        </Text>
      )}
    </View>
  );
}
