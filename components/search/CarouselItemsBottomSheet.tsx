import { SPACING } from '@/constants/spacing';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { BackHandler, Platform, View, useWindowDimensions } from 'react-native';
import { Portal, Text, useTheme } from 'react-native-paper';
import { RecommendationItem } from '../../types/components';
import { CardType } from '../../utils/cardUtils';
import HorizontalFeaturedCard from '../featured/HorizontalFeaturedCard';

interface CarouselItemsBottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  items: RecommendationItem[];
  cardType?: CardType;
}

/**
 * Bottom sheet that displays all carousel items
 * Per MD3 accessibility: allows users to view all items at once
 */
export default function CarouselItemsBottomSheet({
  visible,
  onDismiss,
  title,
  items,
  cardType = 'generic',
}: CarouselItemsBottomSheetProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const scrollViewRef = useRef<any>(null);
  
  // Snap points for the bottom sheet (50% initial, 90% expanded)
  const snapPoints = useMemo(() => ['50%', '90%'], []);

  const renderItem = useCallback(
    ({ item, index }: { item: RecommendationItem; index: number }) => {
      // For did-you-know cards, ensure html is present
      const cardItem =
        cardType === 'did-you-know' && !item.html
          ? ({ ...item, html: item.text || item.description || '' } as RecommendationItem)
          : item;

      return (
        <View
          style={{
            width: '100%',
            marginBottom: SPACING.lg,
          }}
        >
          <HorizontalFeaturedCard
            item={cardItem}
            index={index}
            cardType={cardType}
          />
        </View>
      );
    },
    [cardType]
  );

  const keyExtractor = useCallback((item: RecommendationItem, index: number) => {
    return item.title || `item-${index}`;
  }, []);

  // Backdrop component that closes the sheet when pressed
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  // Handle sheet changes
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      // Sheet is closed
      onDismiss();
    }
  }, [onDismiss]);

  // Open/close sheet based on visible prop
  React.useEffect(() => {
    if (!visible) {
      return;
    }
    
    // Use a small delay to ensure the bottom sheet is mounted and ready
    const timeoutId = setTimeout(() => {
      // Start at 50% (index 0), not fully expanded
      bottomSheetRef.current?.snapToIndex(0);
      // Reset scroll position to top when opening
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: false });
        }
      }, 100);
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [visible]);

  // Handle Android back button - close bottom sheet instead of navigating back
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        // Close the bottom sheet when back button is pressed
        onDismiss();
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    });

    return () => backHandler.remove();
  }, [visible, onDismiss]);

  // Don't render the bottom sheet at all when not visible to prevent blocking touches
  if (!visible) {
    return null;
  }

  return (
    <Portal>
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={handleSheetChanges}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backgroundStyle={{
          backgroundColor: theme.colors.surface,
        }}
        handleIndicatorStyle={{
          backgroundColor: theme.colors.outlineVariant,
        }}
        backdropComponent={renderBackdrop}
        accessibilityViewIsModal={true}
      >
        <BottomSheetScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            paddingTop: SPACING.md, // Match Feed spacing
            paddingBottom: SPACING.lg, // Match Feed spacing
            paddingHorizontal: SPACING.base,
          }}
          accessibilityLabel={`${title} bottom sheet`}
        >
          {/* Title - placed under the handle indicator, left-aligned */}
          <View
            style={{
              paddingBottom: SPACING.base,
              alignItems: 'flex-start',
            }}
            accessible={true}
            accessibilityRole="header"
            accessibilityLabel={title}
            accessibilityLiveRegion="polite"
          >
            <Text
              variant="headlineSmall"
              style={{
                fontWeight: '700',
                color: theme.colors.onSurface,
                textAlign: 'left',
              }}
            >
              {title}
            </Text>
          </View>

          {/* Content */}
          {items.map((item, index) => {
            const isOnThisDay = cardType === 'on-this-day';
            const year = isOnThisDay && 'year' in item ? item.year : undefined;
            const showYearHeader = isOnThisDay && year && (index === 0 || items[index - 1]?.year !== year);

            const handleYearPress = () => {
              if (year) {
                router.push(`/article/${encodeURIComponent(year)}`);
              }
            };

            return (
              <React.Fragment key={keyExtractor(item, index)}>
                {showYearHeader && (
                  <View
                    style={{
                      marginTop: index === 0 ? 0 : SPACING.lg,
                      marginBottom: SPACING.md,
                      paddingHorizontal: SPACING.xs,
                    }}
                  >
                    <Text
                      variant="titleLarge"
                      onPress={handleYearPress}
                      style={{
                        fontWeight: 'bold',
                        color: theme.colors.primary,
                      }}
                    >
                      {year}
                    </Text>
                  </View>
                )}
                <View style={{ marginBottom: SPACING.lg }}>
                  {renderItem({ item, index })}
                </View>
              </React.Fragment>
            );
          })}
        </BottomSheetScrollView>
      </BottomSheet>
    </Portal>
  );
}

