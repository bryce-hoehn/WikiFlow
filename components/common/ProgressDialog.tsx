import React from 'react';
import { useWindowDimensions } from 'react-native';
import { Button, Modal, Portal, useTheme } from 'react-native-paper';
import { LAYOUT } from '../../constants/layout';
import { SPACING } from '../../constants/spacing';
import ProgressIndicator from './ProgressIndicator';

interface ProgressDialogProps {
  /**
   * Whether the dialog is visible
   */
  visible: boolean;
  /**
   * Progress value between 0 and 1
   */
  progress: number;
  /**
   * Message to display
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
  /**
   * Cancel button label
   */
  cancelLabel?: string;
}

/**
 * Dialog component for showing progress of long-running operations
 * Provides a consistent UI for operations like export/import, download all, etc.
 */
function ProgressDialog({
  visible,
  progress,
  message,
  showPercentage = true,
  onCancel,
  cancelLabel = 'Cancel',
}: ProgressDialogProps): JSX.Element {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= LAYOUT.DESKTOP_BREAKPOINT;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onCancel}
        contentContainerStyle={{
          backgroundColor: theme.colors.surface,
          padding: SPACING.lg, // M3: 24dp padding for dialogs
          margin: SPACING.base + SPACING.xs, // M3: 20dp margin
          borderRadius: isLargeScreen ? 28 : SPACING.base, // M3: 28dp for large screens, 16dp for mobile
          alignItems: 'center',
        }}
      >
        <ProgressIndicator progress={progress} message={message} showPercentage={showPercentage} />
        {onCancel && (
          <Button mode="outlined" onPress={onCancel} style={{ marginTop: SPACING.base }}> {/* M3: 16dp spacing */}
            {cancelLabel}
          </Button>
        )}
      </Modal>
    </Portal>
  );
}

export default ProgressDialog;
