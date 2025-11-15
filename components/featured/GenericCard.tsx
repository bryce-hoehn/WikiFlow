import HtmlRenderer from '@/components/common/HtmlRenderer';
import useThumbnailLoader from '@/hooks/ui/useThumbnailLoader';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { memo, useCallback } from 'react';
import { View } from 'react-native';
import { Card, MD3Theme, Text } from 'react-native-paper';

import { RecommendationItem } from '../../types/components';

interface GenericCardProps {
  item: RecommendationItem;
  itemWidth: number;
  theme: MD3Theme;
}

function GenericCard({ item, itemWidth, theme }: GenericCardProps) {
  const thumbnail = useThumbnailLoader(item);

  // Handle card press - navigate to article if available
  const handleCardPress = useCallback(() => {
    if (item?.articleTitle) {
      router.push(`/article/${encodeURIComponent(item.articleTitle)}`);
    } else if (item?.page?.title) {
      router.push(`/article/${encodeURIComponent(item.page.title)}`);
    } else if (item?.title && item.title !== 'Did You Know?' && !item.title.includes('...')) {
      router.push(`/article/${encodeURIComponent(item.title)}`);
    } else if (item?.pageid) {
      router.push(`/article/${encodeURIComponent(item.title || '')}`);
    }
  }, [item?.articleTitle, item?.page?.title, item?.title, item?.pageid]);

  // Determine description and whether it contains HTML
  const description = item.description || item.title || 'No content available';
  const hasHtmlContent = description.includes('<') && description.includes('>');

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
            {item.title || 'Article'}
          </Text>
          {description !== 'No content available' ? (
            hasHtmlContent ? (
              <HtmlRenderer html={description} style={{ fontSize: 14, lineHeight: 18 }} />
            ) : (
              <Text
                variant="bodyMedium"
                style={{ fontSize: 14, lineHeight: 18 }}
                numberOfLines={3}
              >
                {description}
              </Text>
            )
          ) : (
            <Text
              variant="bodyMedium"
              style={{ fontSize: 14, lineHeight: 18, textAlign: 'center' }}
            >
              {description}
            </Text>
          )}
        </Card.Content>
      </Card>
    </View>
  );
}

export default memo(GenericCard);