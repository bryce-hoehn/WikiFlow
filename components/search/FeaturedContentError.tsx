import { useFeaturedContent } from '@/context/FeaturedContentContext';
import React from 'react';
import { View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

/**
 * Fallback UI component for when featured content fails to load.
 * Provides a user-friendly message and a retry button.
 */
export default function FeaturedContentError() {
  const theme = useTheme();
  const { error, refreshFeaturedContent } = useFeaturedContent();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
      <Text variant="titleLarge" style={{ marginBottom: 16, textAlign: 'center' }}>
        Unable to Load Content
      </Text>
      <Text variant="bodyMedium" style={{ marginBottom: 24, textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
        {error || 'There was a problem loading the featured content. Please check your connection and try again.'}
      </Text>
      <Button
        mode="contained"
        onPress={refreshFeaturedContent}
        icon="refresh"
      >
        Try Again
      </Button>
    </View>
  );
}