import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { List, Text, useTheme } from 'react-native-paper';

interface TrendingListItemProps {
  item: {
    id: string;
    title: string;
    normalizedTitle: string;
    thumbnail?: string;
    description?: string;
  };
  itemIndex: number;
  pageIndex: number;
  itemsPerPage: number;
  isFirst: boolean;
  isLast: boolean;
}

export default function TrendingListItem({ 
  item, 
  itemIndex, 
  pageIndex, 
  itemsPerPage, 
  isFirst, 
  isLast 
}: TrendingListItemProps) {
  const theme = useTheme();

  return (
    <View key={item.id}>
      <List.Item
        title={item.normalizedTitle}
        onPress={() => router.push(`/article/${encodeURIComponent(item.title)}`)}
        titleStyle={{
          fontSize: 16,
          fontWeight: '500',
          color: theme.colors.onSurface
        }}
        description={item.description}
        descriptionStyle={{
          fontSize: 12,
          color: theme.colors.onSurfaceVariant,
          marginTop: 2
        }}
        accessibilityLabel={`Open trending article: ${item.normalizedTitle}`}
        accessibilityHint={`Opens the trending article: ${item.normalizedTitle}`}
        left={props => (
          item.thumbnail ? (
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              overflow: 'hidden',
              marginRight: 12,
              marginLeft: 12,
              backgroundColor: theme.colors.surfaceVariant
            }}>
              <Image
                source={{ uri: item.thumbnail }}
                style={{ width: '100%', height: '100%' }}
                placeholder={{ blurhash: 'L5H2EC=PM+yV0gMqNGa#00bH?G-9' }}
                alt={`Thumbnail for ${item.normalizedTitle}`}
                accessibilityLabel={`Thumbnail for ${item.normalizedTitle}`}
              />
            </View>
          ) : (
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              backgroundColor: theme.colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
              marginLeft: 12
            }}
            accessibilityElementsHidden={true}
            importantForAccessibility="no"
            >
              <Text style={{
                fontSize: 14,
                fontWeight: 'bold',
                color: theme.colors.onPrimary
              }}>
                {pageIndex * itemsPerPage + itemIndex + 1}
              </Text>
            </View>
          )
        )}
        style={{ 
          borderRadius: isFirst ? 8 : 0,
          borderTopLeftRadius: isFirst ? 8 : 0,
          borderTopRightRadius: isFirst ? 8 : 0,
          borderBottomLeftRadius: isLast ? 8 : 0,
          borderBottomRightRadius: isLast ? 8 : 0,
          backgroundColor: theme.colors.elevation.level1,
          marginTop: 4
        }}
      />
    </View>
  );
}
