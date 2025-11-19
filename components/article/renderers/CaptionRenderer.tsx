import React from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SPACING } from '../../../constants/spacing';
import { TYPOGRAPHY } from '../../../constants/typography';
import type { TNode } from 'react-native-render-html';

/**
 * Type guard for text node with data
 */
type TNodeText = TNode & {
  type: 'text';
  data: string;
};

/**
 * Custom caption renderer for table captions
 */
export const CaptionRenderer = ({ tnode }: { tnode: TNode }) => {
  const theme = useTheme();

  const textContent = tnode.children
    ?.map((child: TNode) => {
      // Extract text content from text nodes
      if (child.type === 'text' && 'data' in child) {
        return (child as TNodeText).data || '';
      }
      return '';
    })
    .join('')
    .trim();

  if (!textContent) {
    return null;
  }

  return (
    <View
      style={{
        width: '100%',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
      }}
    >
      <Text
        selectable
        style={{
          textAlign: 'center',
          paddingHorizontal: SPACING.sm,
          fontStyle: 'italic',
          color: theme.colors.onSurfaceVariant,
          lineHeight: TYPOGRAPHY.bodyMedium * TYPOGRAPHY.lineHeightNormal,
        }}
      >
        {textContent}
      </Text>
    </View>
  );
};

