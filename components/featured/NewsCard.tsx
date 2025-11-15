import HtmlRenderer from '@/components/common/HtmlRenderer';
import useThumbnailLoader from '@/hooks/ui/useThumbnailLoader';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { memo, useCallback } from 'react';
import { View } from 'react-native';
import { Card, MD3Theme, Text } from 'react-native-paper';

import { RecommendationItem } from '../../types/components';

interface NewsCardProps {
  item: RecommendationItem;
  itemWidth: number;
  theme: MD3Theme;
}

function NewsCard({ item, itemWidth, theme }: NewsCardProps) {
  const thumbnail = useThumbnailLoader(item);

  // Handle card press - navigate to first link if available
  const handleCardPress = useCallback(() => {
    if (item?.links?.[0]?.title) {
      router.push(`/article/${encodeURIComponent(item.links[0].title)}`);
    } else if (item?.articleTitle) {
      router.push(`/article/${encodeURIComponent(item.articleTitle)}`);
    } else if (item?.title) {
      router.push(`/article/${encodeURIComponent(item.title)}`);
    }
  }, [item]);

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
            {(item.title || 'News Story').replace(/_/g, ' ')}
          </Text>
          {item.description && item.description.includes('<') ? (
            <HtmlRenderer
              html={item.description}
              maxLines={6}
              style={{ paddingTop: 12 }}
            />
          ) : (
            <Text
              variant="bodyMedium"
              style={{ fontSize: 14, lineHeight: 18, paddingTop: 12 }}
              numberOfLines={6}
            >
              {item.description || item.story || 'Latest news'}
            </Text>
          )}
        </Card.Content>
      </Card>
    </View>
  );
}

export default memo(NewsCard);