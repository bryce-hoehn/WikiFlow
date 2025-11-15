import HtmlRenderer from '@/components/common/HtmlRenderer';
import useThumbnailLoader from '@/hooks/ui/useThumbnailLoader';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { memo, useCallback } from 'react';
import { View } from 'react-native';
import { Card, MD3Theme, Text } from 'react-native-paper';

import { DidYouKnowItem } from '../../types/api/featured';

interface DidYouKnowCardProps {
  item: DidYouKnowItem;
  itemWidth: number;
  theme: MD3Theme;
}

function DidYouKnowCard({ item, itemWidth, theme }: DidYouKnowCardProps) {
  const thumbnail = useThumbnailLoader(item);

  // Extract title from HTML for navigation
  const titleMatch = item.html?.match(/title="([^"]*)"/);
  const title = titleMatch?.[1] || 'Did You Know?';

  // Handle card press - navigate to article if title is available
  const handleCardPress = useCallback(() => {
    if (title && title !== 'Did You Know?') {
      router.push(`/article/${encodeURIComponent(title)}`);
    }
  }, [title]);

  return (
    <View style={{ flex: 1 }}>
      <Card
        style={{
          width: '100%',
          borderRadius: 12,
          overflow: 'hidden',
        }}
        onPress={handleCardPress}
      >
        <View style={{ height: 160, width: '100%', backgroundColor: theme.colors.surfaceVariant }}>
          {thumbnail ? (
            <Image
              source={{ uri: thumbnail }}
              style={{ height: 160, width: '100%' }}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                No Image
              </Text>
            </View>
          )}
        </View>
        <Card.Content style={{ padding: 12 }}>
          <Text
            variant="titleMedium"
            style={{ fontWeight: 'bold', marginBottom: 4 }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <HtmlRenderer
            html={item.html || 'No content available'}
            maxLines={6}
            style={{ paddingTop: 12 }}
          />
        </Card.Content>
      </Card>
    </View>
  );
}

export default memo(DidYouKnowCard);