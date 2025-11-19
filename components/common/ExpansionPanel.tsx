import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { MOTION } from '../../constants/motion';
import { SPACING } from '../../constants/spacing';
import { TYPOGRAPHY } from '../../constants/typography';
import { useReducedMotion } from '../../hooks';

interface ExpansionPanelProps {
  title: string;
  expanded: boolean;
  onPress: () => void;
  children: React.ReactNode;
  /**
   * Whether to show the expand/collapse icon
   * @default true
   */
  showIcon?: boolean;
  /**
   * Custom title style
   */
  titleStyle?: any;
  /**
   * Custom container style
   */
  style?: any;
  /**
   * Accessibility label for the section header
   */
  accessibilityLabel?: string;
  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Expansion panel component (MD3) that replaces List.Accordion
 * 
 * Benefits over List.Accordion:
 * - Smooth animations without layout jumps
 * - Better mobile performance
 * - Proper height measurement
 * - No scroll position issues
 * - Respects reduced motion preferences
 * 
 * Uses Animated API for smooth height transitions that don't cause page jumps.
 */
export default function ExpansionPanel({
  title,
  expanded,
  onPress,
  children,
  showIcon = true,
  titleStyle,
  style,
  accessibilityLabel,
  testID,
}: ExpansionPanelProps) {
  const theme = useTheme();
  const { reducedMotion } = useReducedMotion();
  
  // Animated value for height (0 when collapsed, measured height when expanded)
  // MUST use JS driver (useNativeDriver: false) - height cannot be animated natively
  const animatedHeight = useRef(new Animated.Value(0)).current;
  // Animated value for opacity (for smooth fade in/out)
  const animatedOpacity = useRef(new Animated.Value(0)).current;
  // Animated value for rotation of chevron icon
  const animatedRotation = useRef(new Animated.Value(0)).current;
  
  // Track animation references to stop them if needed
  const heightAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const opacityRotationAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  
  // Track the actual content height
  const [contentHeight, setContentHeight] = useState(0);
  const [isMeasuring, setIsMeasuring] = useState(true);
  const contentRef = useRef<View>(null);
  const hasMeasuredRef = useRef(false);
  const needsMeasurementRef = useRef(true);

  // Measure content height when it changes
  // Only measure when expanded or when we haven't measured yet
  const handleContentLayout = useCallback((event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0) {
      const wasMeasuring = !hasMeasuredRef.current;
      // Always update if height changed (content might have updated)
      if (wasMeasuring || Math.abs(height - contentHeight) > 1) {
        setContentHeight(height);
        setIsMeasuring(false);
        hasMeasuredRef.current = true;
        needsMeasurementRef.current = false;
        
        // If expanded and this is a content update (not initial measurement), update animated value
        if (expanded && !wasMeasuring) {
          // Small delay to ensure layout is complete
          requestAnimationFrame(() => {
            animatedHeight.setValue(height + 1); // Add buffer
          });
        }
      }
    }
  }, [contentHeight, expanded, animatedHeight]);

  // Animate height and opacity when expanded state changes
  useEffect(() => {
    if (isMeasuring || contentHeight === 0) return; // Don't animate while measuring or if no content
    
    // Stop any running animations first to prevent conflicts
    if (heightAnimationRef.current) {
      heightAnimationRef.current.stop();
      heightAnimationRef.current = null;
    }
    if (opacityRotationAnimationRef.current) {
      opacityRotationAnimationRef.current.stop();
      opacityRotationAnimationRef.current = null;
    }
    
    if (reducedMotion) {
      // Instant change for reduced motion
      // Add a small buffer to ensure content isn't cut off
      const heightWithBuffer = expanded ? contentHeight + 1 : 0; // 1px buffer
      animatedHeight.setValue(heightWithBuffer);
      animatedOpacity.setValue(expanded ? 1 : 0);
      animatedRotation.setValue(expanded ? 1 : 0);
      return;
    }

    // Animate height separately (can't use native driver)
    // CRITICAL: useNativeDriver MUST be false for height animations
    // Add a small buffer to ensure content isn't cut off
    const targetHeight = expanded ? contentHeight + 1 : 0; // 1px buffer to prevent clipping
    const heightAnimation = Animated.timing(animatedHeight, {
      toValue: targetHeight,
      duration: MOTION.durationMedium, // 200ms per MD3
      useNativeDriver: false, // Height animations MUST use JS driver
    });
    heightAnimationRef.current = heightAnimation;

    // Animate opacity and rotation together (can use native driver)
    const opacityRotationAnimation = Animated.parallel([
      Animated.timing(animatedOpacity, {
        toValue: expanded ? 1 : 0,
        duration: MOTION.durationShort, // 150ms for opacity
        useNativeDriver: true,
      }),
      Animated.timing(animatedRotation, {
        toValue: expanded ? 1 : 0,
        duration: MOTION.durationMedium,
        useNativeDriver: true,
      }),
    ]);
    opacityRotationAnimationRef.current = opacityRotationAnimation;

    // Start both animations
    heightAnimation.start(() => {
      heightAnimationRef.current = null;
    });
    opacityRotationAnimation.start(() => {
      opacityRotationAnimationRef.current = null;
    });
  }, [expanded, contentHeight, isMeasuring, reducedMotion, animatedHeight, animatedOpacity, animatedRotation]);

  // Initialize values when content height is first measured
  // Use setValue directly (not animated) to avoid driver conflicts
  useEffect(() => {
    if (contentHeight > 0 && isMeasuring) {
      // Stop any running animations before setting values
      if (heightAnimationRef.current) {
        heightAnimationRef.current.stop();
        heightAnimationRef.current = null;
      }
      if (opacityRotationAnimationRef.current) {
        opacityRotationAnimationRef.current.stop();
        opacityRotationAnimationRef.current = null;
      }
      
      // Set values directly (not animated) for initial state
      // Add a small buffer to ensure content isn't cut off
      const heightWithBuffer = contentHeight + 1; // 1px buffer to prevent clipping
      animatedHeight.setValue(expanded ? heightWithBuffer : 0);
      animatedOpacity.setValue(expanded ? 1 : 0);
      animatedRotation.setValue(expanded ? 1 : 0);
    }
  }, [contentHeight, expanded, isMeasuring, animatedHeight, animatedOpacity, animatedRotation]);

  // Cleanup: stop animations on unmount
  useEffect(() => {
    return () => {
      if (heightAnimationRef.current) {
        heightAnimationRef.current.stop();
        heightAnimationRef.current = null;
      }
      if (opacityRotationAnimationRef.current) {
        opacityRotationAnimationRef.current.stop();
        opacityRotationAnimationRef.current = null;
      }
    };
  }, []);

  // Rotate chevron icon (180 degrees when expanded)
  const rotateInterpolate = animatedRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Header - always visible */}
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.header,
          {
            backgroundColor: pressed ? theme.colors.surfaceVariant : 'transparent',
          },
        ]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={accessibilityLabel || `${title}, ${expanded ? 'expanded' : 'collapsed'}`}
        accessibilityHint={expanded ? 'Tap to collapse section' : 'Tap to expand section'}
      >
        <Text
          variant="titleMedium"
          style={[
            styles.title,
            {
              fontWeight: '700',
              fontSize: TYPOGRAPHY.titleLarge, // 22sp for section headings
              color: theme.colors.onSurface,
            },
            titleStyle,
          ]}
        >
          {title}
        </Text>
        {showIcon && (
          <Animated.View
            style={{
              transform: [{ rotate: rotateInterpolate }],
              width: 48,
              height: 48,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            // Remove button semantics since the parent Pressable handles interaction
            accessibilityElementsHidden={true}
            importantForAccessibility="no"
          >
            <Icon
              source="chevron-down"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
          </Animated.View>
        )}
      </Pressable>

      {/* Content - animated height */}
      {/* Only render when expanded to avoid expensive RenderHtml calls for collapsed sections */}
      {/* When expanded, render directly (no double rendering) */}
      {/* When collapsed but needs measurement, render hidden measurement view */}
      {expanded ? (
        <Animated.View
          style={{
            height: animatedHeight,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              opacity: animatedOpacity,
            }}
          >
            <View
              ref={contentRef}
              onLayout={handleContentLayout}
              style={styles.content}
              collapsable={false}
            >
              {children}
            </View>
          </Animated.View>
        </Animated.View>
      ) : needsMeasurementRef.current ? (
        // Only render hidden measurement view when collapsed and we haven't measured yet
        // This allows us to get the height for smooth animation when first expanded
        <View
          style={{
            position: 'absolute',
            opacity: 0,
            zIndex: -1,
            width: '100%',
            top: 0,
            left: 0,
          }}
          pointerEvents="none"
          collapsable={false}
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
          // Prevent focus on web
          {...(Platform.OS === 'web' && {
            tabIndex: -1,
            inert: true,
          } as any)}
        >
          <View
            ref={contentRef}
            onLayout={handleContentLayout}
            style={styles.content}
            collapsable={false}
            accessibilityElementsHidden={true}
            importantForAccessibility="no"
            // Prevent focus on web
            {...(Platform.OS === 'web' && {
              tabIndex: -1,
              inert: true,
            } as any)}
          >
            {children}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    minHeight: 48, // MD3 minimum touch target
    borderRadius: 0, // Flat design for sections
  },
  title: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  content: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.base,
  },
});

