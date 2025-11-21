import { FlashList } from '@shopify/flash-list';
import React, { memo, useCallback, useRef, useState } from 'react';
import { Animated, Platform, View } from 'react-native';
import { Divider, List, Text, useTheme } from 'react-native-paper';
import { MOTION } from '../../constants/motion';
import { SPACING } from '../../constants/spacing';
import { useImagePrefetching, useReducedMotion } from '../../hooks';
import ResponsiveImage from '../common/ResponsiveImage';

interface BaseListWithHeaderProps<T> {
  data: T[];
  headerTitle: string;
  getTitle: (item: T) => string;
  getDescription?: (item: T) => string;
  getThumbnail?: (item: T) => string | null;
  getThumbnailDimensions?: (item: T) => { width: number; height: number } | null;
  fallbackIcon?: string;
  onItemPress: (item: T) => void;
  keyExtractor: (item: T) => string;
  accessibilityLabel?: (item: T) => string;
  accessibilityHint?: (item: T) => string;
  estimatedItemSize?: number;
}

/**
 * Base component for lists with headers
 * Consolidates common structure: header text and FlashList with List.Item
 */
// Hoverable list item component for web hover animations
function HoverableListItem<T>({
  item,
  title,
  description,
  thumbnail,
  dimensions,
  thumbnailSize,
  defaultWidth,
  defaultHeight,
  fallbackIcon,
  onItemPress,
  accessibilityLabel,
  accessibilityHint,
  theme,
}: {
  item: T;
  title: string;
  description?: string;
  thumbnail: string | null;
  dimensions: { width: number; height: number } | null;
  thumbnailSize: number;
  defaultWidth: number;
  defaultHeight: number;
  fallbackIcon: string;
  onItemPress: (item: T) => void;
  accessibilityLabel?: (item: T) => string;
  accessibilityHint?: (item: T) => string;
  theme: any;
}) {
  const { reducedMotion } = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);
  const hoverAnim = useRef(new Animated.Value(0)).current;
  
  const handleMouseEnter = () => {
    if (Platform.OS === 'web' && !reducedMotion) {
      setIsHovered(true);
      Animated.timing(hoverAnim, {
        toValue: 1,
        duration: MOTION.durationShort,
        useNativeDriver: false,
      }).start();
    } else if (Platform.OS === 'web' && reducedMotion) {
      // Instant change when reduced motion is enabled
      setIsHovered(true);
      hoverAnim.setValue(1);
    }
  };
  
  const handleMouseLeave = () => {
    if (Platform.OS === 'web' && !reducedMotion) {
      setIsHovered(false);
      Animated.timing(hoverAnim, {
        toValue: 0,
        duration: MOTION.durationShort,
        useNativeDriver: false,
      }).start();
    } else if (Platform.OS === 'web' && reducedMotion) {
      // Instant change when reduced motion is enabled
      setIsHovered(false);
      hoverAnim.setValue(0);
    }
  };
  
  const backgroundColor = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      theme.colors.elevation.level2,
      theme.colors.elevation.level3,
    ],
  });
  
  const scale = hoverAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.01],
  });

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        marginHorizontal: Platform.OS === 'web' ? SPACING.sm : 0,
        marginVertical: SPACING.xs / 2,
        borderRadius: theme.roundness,
        backgroundColor: Platform.OS === 'web' ? backgroundColor : theme.colors.elevation.level2,
        overflow: 'hidden',
      }}
      {...(Platform.OS === 'web' && {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      })}
    >
      <List.Item
        title={title}
        description={description}
        style={{
          backgroundColor: 'transparent',
          padding: SPACING.base,
          minHeight: 56,
        }}
        titleStyle={{
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 20,
        }}
        descriptionStyle={{
          fontSize: 13,
          lineHeight: 18,
          marginTop: 2,
        }}
        left={(props) =>
          thumbnail ? (
            <ResponsiveImage
              source={{
                source: thumbnail,
                width: dimensions?.width || defaultWidth,
                height: dimensions?.height || defaultHeight,
              }}
              contentFit="cover"
              style={{
                width: thumbnailSize,
                height: thumbnailSize,
                borderRadius: theme.roundness * 2,
                marginRight: SPACING.sm,
              }}
              alt={`Thumbnail for ${title}`}
            />
          ) : (
            <View
              style={{
                width: thumbnailSize,
                height: thumbnailSize,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <List.Icon {...props} icon={fallbackIcon} />
            </View>
          )
        }
        onPress={() => onItemPress(item)}
        accessibilityLabel={accessibilityLabel ? accessibilityLabel(item) : `Open: ${title}`}
        accessibilityHint={accessibilityHint ? accessibilityHint(item) : `Opens ${title}`}
      />
    </Animated.View>
  );
}

function BaseListWithHeader<T>({
  data,
  headerTitle,
  getTitle,
  getDescription,
  getThumbnail,
  getThumbnailDimensions,
  fallbackIcon = 'file-document-outline',
  onItemPress,
  keyExtractor,
  accessibilityLabel,
  accessibilityHint,
  estimatedItemSize = 80,
}: BaseListWithHeaderProps<T>) {
  const theme = useTheme();

  // Image prefetching: Prefetch images for items about to become visible
  const { onViewableItemsChanged } = useImagePrefetching({
    data,
    getImageUrl: (item) => {
      if (!getThumbnail) return undefined;
      const thumbnail = getThumbnail(item);
      return typeof thumbnail === 'string' ? thumbnail : undefined;
    },
    preferredWidth: 56, // Standard width for list thumbnails
  });

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // Item is considered visible when 50% is shown
    minimumViewTime: 100, // Minimum time item must be visible (ms)
  }).current;

  const renderItem = useCallback(
    ({ item }: { item: T }) => {
      const title = getTitle(item);
      const description = getDescription ? getDescription(item) : undefined;
      const thumbnail = getThumbnail ? getThumbnail(item) : null;
      const dimensions = getThumbnailDimensions ? getThumbnailDimensions(item) : null;
      const thumbnailSize = 56; // Smaller thumbnails for better list density
      const defaultWidth = thumbnailSize;
      const defaultHeight = thumbnailSize;

      return (
        <HoverableListItem
          item={item}
          title={title}
          description={description}
          thumbnail={thumbnail}
          dimensions={dimensions}
          thumbnailSize={thumbnailSize}
          defaultWidth={defaultWidth}
          defaultHeight={defaultHeight}
          fallbackIcon={fallbackIcon}
          onItemPress={onItemPress}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          theme={theme}
        />
      );
    },
    [
      getTitle,
      getDescription,
      getThumbnail,
      getThumbnailDimensions,
      fallbackIcon,
      onItemPress,
      accessibilityLabel,
      accessibilityHint,
      theme,
    ]
  );

  const renderHeader = useCallback(
    () => (
      <>
        <Text
          variant="titleMedium"
          style={{
            paddingHorizontal: Platform.OS === 'web' ? SPACING.md : SPACING.sm,
            paddingTop: SPACING.lg,
            paddingBottom: SPACING.lg,
            color: theme.colors.onSurface,
            fontWeight: '500',
            letterSpacing: 0.15,
          }}
          // MD3 Accessibility: Proper header role - per https://m3.material.io/components/search/accessibility
          accessibilityRole="header"
          accessibilityLabel={headerTitle}
        >
          {headerTitle}
        </Text>
        <Divider style={{ marginHorizontal: Platform.OS === 'web' ? 0 : SPACING.xs, marginBottom: SPACING.xs }} />
      </>
    ),
    [headerTitle, theme]
  );

  return (
    <>
      {renderHeader()}
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        {...({ estimatedItemSize } as any)}
        contentContainerStyle={{ 
          paddingTop: SPACING.xs,
          paddingBottom: SPACING.sm,
          paddingHorizontal: Platform.OS === 'web' ? 0 : SPACING.xs,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        // MD3 Accessibility: Proper list role - per https://m3.material.io/components/search/accessibility
        accessibilityRole="list"
        accessibilityLabel={`${data.length} ${headerTitle.toLowerCase()}`}
      />
    </>
  );
}

export default memo(BaseListWithHeader) as typeof BaseListWithHeader;
