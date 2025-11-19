import { LAYOUT } from '@/constants/layout';
import { MOTION } from '@/constants/motion';
import { SPACING } from '@/constants/spacing';
import { useReducedMotion } from '@/hooks';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, useWindowDimensions, View } from 'react-native';
import { Surface, useTheme } from 'react-native-paper';

/**
 * Skeleton loader component that matches Subcategory page layout
 * Shows skeleton for subcategories and article cards
 */
export default function SubcategorySkeleton() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { reducedMotion } = useReducedMotion();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  const numColumns =
    width >= LAYOUT.XLARGE_BREAKPOINT ? 4 : width >= LAYOUT.DESKTOP_BREAKPOINT ? 3 : 2;

  // Shimmer animation (skip if reduced motion is enabled)
  useEffect(() => {
    if (reducedMotion) {
      fadeAnim.setValue(1);
      shimmerAnim.setValue(0);
      return;
    }

    const useNativeDriver = Platform.OS !== 'web';
    const shimmerSegmentDuration = MOTION.durationShimmer / 2;

    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: shimmerSegmentDuration,
          useNativeDriver,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: shimmerSegmentDuration,
          useNativeDriver,
        }),
      ])
    );
    shimmer.start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: MOTION.durationMedium,
      useNativeDriver,
    }).start();

    return () => shimmer.stop();
  }, [shimmerAnim, fadeAnim, reducedMotion]);

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 0.7, 0.2],
  });

  const SkeletonBox = ({
    width,
    height,
    borderRadius = undefined,
    style,
  }: {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: React.ComponentProps<typeof View>['style'];
  }) => {
    const baseStyle: React.ComponentProps<typeof View>['style'] = {
      width: width as React.ComponentProps<typeof View>['style'] extends { width?: infer W }
        ? W
        : never,
      height,
      borderRadius: borderRadius ?? theme.roundness,
      backgroundColor: theme.colors.surfaceVariant,
      overflow: 'hidden',
    };

    return (
      <View style={style ? [baseStyle, style] : baseStyle}>
        <Animated.View
          style={{
            flex: 1,
            width: '100%',
            backgroundColor: theme.colors.elevation.level2,
            transform: [{ translateX: shimmerTranslateX }],
            opacity: shimmerOpacity,
          }}
        />
      </View>
    );
  };

  // Render skeleton for subcategory item - matches List.Item structure
  const SubcategorySkeletonItem = () => (
    <Surface
      elevation={1}
      style={{
        borderRadius: theme.roundness * 3, // 12dp equivalent (4dp * 3)
        margin: SPACING.xs,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: SPACING.sm,
          paddingHorizontal: SPACING.base, // List.Item default horizontal padding
        }}
      >
        <SkeletonBox
          width={24}
          height={24}
          borderRadius={theme.roundness * 0.75}
          style={{ marginRight: SPACING.md }}
        />
        <SkeletonBox width="70%" height={16} />
      </View>
    </Surface>
  );

  // Render skeleton for article card - match exact structure of actual cards
  const ArticleCardSkeleton = () => (
    <View style={{ flex: 1, margin: SPACING.xs }}>
      <View
        style={{
          borderRadius: theme.roundness * 3, // 12dp equivalent (4dp * 3)
          backgroundColor: theme.colors.elevation.level2,
          overflow: 'hidden',
        }}
      >
        <SkeletonBox width="100%" height={120} />
        <View style={{ padding: SPACING.md }}>
          <SkeletonBox width="85%" height={16} style={{ marginBottom: SPACING.sm }} />
          <SkeletonBox width="100%" height={12} style={{ marginBottom: SPACING.xs }} />
          <SkeletonBox width="75%" height={12} />
        </View>
      </View>
    </View>
  );

  return (
    <Animated.View style={{ opacity: fadeAnim, flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1, padding: SPACING.base }}>
        {/* Subcategories Section Skeleton */}
        <View style={{ marginBottom: SPACING.base }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
            <SkeletonBox width={120} height={20} style={{ marginRight: SPACING.sm }} />
            <SkeletonBox width={24} height={24} borderRadius={theme.roundness * 0.75} />
          </View>
          <View>
            {[0, 1, 2, 3].map((index) => (
              <SubcategorySkeletonItem key={index} />
            ))}
          </View>
        </View>

        {/* Articles Section Skeleton */}
        <View>
          <SkeletonBox width={80} height={20} style={{ marginBottom: SPACING.md }} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -SPACING.xs }}>
            {Array.from({ length: numColumns * 2 }).map((_, index) => (
              <View key={index} style={{ width: `${100 / numColumns}%`, paddingHorizontal: SPACING.xs }}>
                <ArticleCardSkeleton />
              </View>
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
