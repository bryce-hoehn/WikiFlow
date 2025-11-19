import { SPACING } from '@/constants/spacing';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';

interface ContentSectionProps {
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  skeleton?: React.ReactNode;
  hasCarousel?: boolean;
  onHeaderPress?: () => void;
}

/**
 * Reusable content section component for SearchScreen
 * Handles title, loading state, and content rendering
 * Per MD3 accessibility: carousel sections have arrow icon button next to header
 */
export default function ContentSection({
  title,
  children,
  isLoading = false,
  skeleton,
  hasCarousel = false,
  onHeaderPress,
}: ContentSectionProps) {
  const theme = useTheme();

  if (isLoading && skeleton) {
    return skeleton;
  }

  if (!children) {
    return null;
  }

  return (
    <View
      style={{
        width: '100%',
        marginBottom: SPACING.lg,
        backgroundColor: theme.colors.background,
        flex: 1,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
          marginBottom: SPACING.sm,
          gap: SPACING.xs,
        }}
      >
        <TouchableOpacity
          onPress={hasCarousel ? onHeaderPress : undefined}
          disabled={!hasCarousel || !onHeaderPress}
          style={{ flex: 1 }}
          activeOpacity={hasCarousel ? 0.7 : 1}
        >
          <Text
            variant="headlineMedium"
            style={{
              fontWeight: '700',
              color: theme.colors.onSurface,
              textAlign: 'left',
            }}
          >
            {title}
          </Text>
        </TouchableOpacity>
        {hasCarousel && onHeaderPress && (
          <IconButton
            icon={({ size, color }) => (
              <MaterialIcons name="arrow-forward" size={size} color={color} />
            )}
            iconColor={theme.colors.onSurfaceVariant}
            size={24}
            onPress={onHeaderPress}
            style={{ margin: 0 }}
            accessibilityLabel={`View all ${title}`}
            accessibilityHint={`Opens a modal showing all items in ${title}`}
          />
        )}
      </View>
      <View style={{ width: '100%', flex: 1 }}>{children}</View>
    </View>
  );
}
