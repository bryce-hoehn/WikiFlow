import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { IconButton, Portal, Searchbar, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EASING, MOTION } from '../../constants/motion';
import { SPACING } from '../../constants/spacing';
import {
  useDebounce,
  useReducedMotion,
  useSearchSuggestions,
  useVisitedArticles,
} from '../../hooks';
import { SearchOverlayProps } from '../../types';
import NoResultsState from './NoResultsState';
import RecentArticlesList from './RecentArticlesList';
import SearchResultSkeleton from './SearchResultSkeleton';
import SearchResultsList from './SearchResultsList';

/**
 * SearchOverlay component following Material Design 3 guidelines
 *
 * Material Design 3 Compliance:
 * - Full-screen overlay on mobile, modal-style on web
 * - Proper backdrop with dismiss on tap (web)
 * - Keyboard-aware scrolling
 * - Smooth animations
 * - Proper accessibility
 * - Cross-platform support
 */
export default function SearchOverlay({ visible, onClose, initialQuery = '' }: SearchOverlayProps) {
  const theme = useTheme();
  const { reducedMotion } = useReducedMotion();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState(initialQuery);
  const { visitedArticles } = useVisitedArticles();
  const searchInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(reducedMotion ? 0 : -20)).current;
  const isNavigatingRef = useRef(false);

  const debouncedQuery = useDebounce(query, 300);
  const { data: suggestions, isLoading: isLoadingSuggestions } =
    useSearchSuggestions(debouncedQuery);

  // Animate overlay in/out
  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: reducedMotion ? 0 : MOTION.durationMedium,
          easing: Easing.bezier(...EASING.decelerate),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: reducedMotion ? 0 : MOTION.durationMedium,
          easing: Easing.bezier(...EASING.decelerate),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: reducedMotion ? 0 : MOTION.durationShort,
          easing: Easing.bezier(...EASING.accelerate),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -20,
          duration: reducedMotion ? 0 : MOTION.durationShort,
          easing: Easing.bezier(...EASING.accelerate),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, reducedMotion, fadeAnim, slideAnim]);

  // Reset query when overlay closes
  useEffect(() => {
    if (!visible) {
      // Small delay to allow animations to complete
      const timer = setTimeout(
        () => {
          setQuery('');
          // Reset navigating flag when overlay is fully closed
          isNavigatingRef.current = false;
        },
        reducedMotion ? 0 : MOTION.durationMedium
      );
      return () => clearTimeout(timer);
    } else if (initialQuery && !isNavigatingRef.current) {
      setQuery(initialQuery);
    }
  }, [visible, initialQuery, reducedMotion]);

  // Dismiss keyboard when overlay closes
  useEffect(() => {
    if (!visible) {
      Keyboard.dismiss();
    }
  }, [visible]);

  // MD3 Accessibility: Focus management - ensure search input receives focus when overlay opens
  // per https://m3.material.io/components/search/accessibility
  useEffect(() => {
    if (visible && searchInputRef.current) {
      // Small delay to ensure the overlay is fully rendered
      const timeoutId = setTimeout(() => {
        if (Platform.OS === 'web') {
          // Web: Use focus() method
          const input = searchInputRef.current as any;
          if (input?.focus) {
            input.focus();
          }
        } else {
          // Native: Searchbar handles autoFocus, but ensure it's focused
          if (searchInputRef.current) {
            (searchInputRef.current as any)?.focus?.();
          }
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [visible]);

  const handleSearchSubmit = useCallback(() => {
    if (query.trim()) {
      router.push(`/article/${encodeURIComponent(query)}`);
      onClose();
    }
  }, [query, onClose]);

  const handleSuggestionClick = useCallback(
    (title: string) => {
      // Set navigating flag to prevent overlay from reopening
      isNavigatingRef.current = true;
      // Dismiss keyboard first
      Keyboard.dismiss();
      
      // Navigate first to ensure navigation starts before overlay closes
      router.push(`/article/${encodeURIComponent(title)}`);
      
      // Close overlay after a minimal delay to ensure navigation is queued
      // Use requestAnimationFrame to ensure navigation starts before close
      requestAnimationFrame(() => {
        onClose();
      });
    },
    [onClose]
  );

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  // Handle backdrop press (web only)
  const handleBackdropPress = useCallback(
    (e: any) => {
      if (Platform.OS === 'web') {
        // Only close if clicking directly on backdrop, not on content
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }
    },
    [handleClose]
  );

  const recentVisitedArticles = useMemo(
    () =>
      visitedArticles.slice(0, 10).map((article) => ({
        title: article.title,
        visitedAt: article.visitedAt,
      })), // Limit to 10 most recent
    [visitedArticles]
  );

  // Determine what to show
  const safeSuggestions = suggestions || [];
  const showSearchResults = safeSuggestions.length > 0 && !isLoadingSuggestions;
  const showNoResults =
    debouncedQuery.trim().length > 2 && safeSuggestions.length === 0 && !isLoadingSuggestions;
  const showRecentlyViewed =
    recentVisitedArticles.length > 0 &&
    !showSearchResults &&
    !showNoResults &&
    !isLoadingSuggestions;

  if (!visible) {
    return null;
  }

  const content = (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View
          style={[
            styles.overlay,
            {
              backgroundColor: theme.colors.background,
            },
          ]}
          accessible={true}
          accessibilityLabel="Search overlay"
          accessibilityRole="search"
          importantForAccessibility="yes"
          collapsable={false}
        >
          {/* Full-width search bar directly under status bar */}
          {/* MD3 Search View: Search bar container with proper elevation - per https://m3.material.io/components/search/guidelines */}
          <View
            style={[
              styles.searchBarContainer,
              {
                paddingTop: insets.top,
                backgroundColor: theme.colors.surface,
                // MD3: 56dp search bar height + safe area top
                height: 56 + insets.top,
              },
            ]}
          >
            <View
              style={[
                styles.searchBarWrapper,
                { 
                  justifyContent: 'center', 
                  flex: 1, 
                  // MD3: 56dp minimum height for search bar
                  minHeight: 56,
                  height: 56,
                },
              ]}
            >
              <Searchbar
                ref={searchInputRef}
                placeholder="Search Wikipedia"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearchSubmit}
                onIconPress={handleSearchSubmit}
                onClearIconPress={() => setQuery('')}
                // Hide clearIcon on Android to avoid duplicate X buttons
                // Android's keyboard shows its own clear button, and Searchbar also renders one
                clearIcon={
                  Platform.OS === 'android'
                    ? undefined
                    : query && query.length > 0
                      ? 'close'
                      : undefined
                }
                mode="bar"
                style={[
                  styles.searchBar,
                  {
                    elevation: 0,
                    backgroundColor: 'transparent',
                    borderRadius: 0,
                    // MD3: Ensure 56dp height for search bars - per https://m3.material.io/components/search/specs
                    minHeight: 56,
                    height: 56,
                  },
                ]}
                inputStyle={{
                  // fontSize removed - using variant default
                  color: theme.colors.onSurface,
                  paddingVertical: 0,
                  textAlignVertical: 'center',
                  includeFontPadding: false,
                }}
                iconColor={theme.colors.onSurfaceVariant}
                // MD3 Accessibility: Proper labels and hints - per https://m3.material.io/components/search/accessibility
                accessibilityLabel="Search Wikipedia"
                accessibilityRole="search"
                accessibilityHint={
                  query && query.length > 0
                    ? `Searching for "${query}". Press enter to view results.`
                    : 'Enter search terms to find Wikipedia articles'
                }
                autoFocus
                returnKeyType="search"
                {...(Platform.OS === 'android' && {
                  autoComplete: 'off',
                  importantForAutofill: 'no',
                  // Try to prevent Android keyboard clear button (may not work on all devices)
                  textContentType: 'none',
                })}
              />
              <IconButton
                icon="close"
                size={24}
                onPress={handleClose}
                style={styles.closeButton}
                iconColor={theme.colors.onSurface}
                // MD3 Accessibility: Clear button label and hint - per https://m3.material.io/components/search/accessibility
                accessibilityLabel="Close search"
                accessibilityRole="button"
                accessibilityHint="Closes the search overlay and returns to the previous screen"
              />
            </View>
          </View>

          <ScrollView
            style={[
              styles.scrollView,
              Platform.OS !== 'web' && {
                // MD3: Account for 56dp search bar + safe area
                maxHeight: SCREEN_HEIGHT - (56 + insets.top),
              },
            ]}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={true}
            // MD3 Accessibility: Proper role for search results area - per https://m3.material.io/components/search/accessibility
            accessibilityRole="list"
            accessibilityLabel={
              showSearchResults
                ? `${safeSuggestions.length} search results found`
                : showNoResults
                  ? 'No search results found'
                  : showRecentlyViewed
                    ? `${recentVisitedArticles.length} recently viewed articles`
                    : 'Search results'
            }
          >
            {/* Loading State */}
            {isLoadingSuggestions && debouncedQuery.length > 2 && (
              <View
                style={styles.skeletonContainer}
                // MD3 Accessibility: Loading state announcement - per https://m3.material.io/components/search/accessibility
                accessibilityRole="progressbar"
                accessibilityLabel="Loading search results"
                accessibilityLiveRegion="polite"
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <SearchResultSkeleton key={`skeleton-${index}`} index={index} />
                ))}
              </View>
            )}

            {/* Search Results */}
            {showSearchResults && (
              <SearchResultsList
                suggestions={safeSuggestions}
                onSuggestionClick={handleSuggestionClick}
              />
            )}

            {/* No Results */}
            {showNoResults && (
              <View
                // MD3 Accessibility: Proper role for no results state - per https://m3.material.io/components/search/accessibility
                accessibilityRole="alert"
                accessibilityLabel={`No results found for "${query}"`}
              >
                <NoResultsState query={query} onClearSearch={handleClose} />
              </View>
            )}

            {/* Recently Viewed */}
            {showRecentlyViewed && (
              <RecentArticlesList
                recentVisitedArticles={recentVisitedArticles}
                onSuggestionClick={handleSuggestionClick}
              />
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );

  // On web, use Portal with backdrop. On mobile, also use Portal for proper z-index
  // Dynamic backdrop style using theme colors
  const backdropStyle = Platform.select({
    web: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.scrim + '80', // 50% opacity (0x80 in hex = 128/255 ≈ 0.5)
      zIndex: 999,
      display: 'flex' as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    default: {},
  });

  if (Platform.OS === 'web') {
    return (
      <Portal>
        <View
          style={backdropStyle}
          onStartShouldSetResponder={() => true}
          onResponderRelease={handleBackdropPress}
          // Web-specific click handler
          {...(Platform.OS === 'web' && {
            onClick: handleBackdropPress,
            onMouseDown: (e: any) => {
              // Prevent event from bubbling to content
              if (e.target === e.currentTarget) {
                e.stopPropagation();
              }
            },
          })}
          accessibilityLabel="Close search overlay"
          accessibilityRole="button"
          testID="search-overlay-backdrop"
        >
          <View
            style={styles.overlayContainer}
            onStartShouldSetResponder={() => false}
            onResponderRelease={(e) => e.stopPropagation()}
            // Web-specific click handler to prevent backdrop close
            {...(Platform.OS === 'web' && {
              onClick: (e: any) => e.stopPropagation(),
            })}
          >
            {content}
          </View>
        </View>
      </Portal>
    );
  }

  // On mobile, use Portal to ensure overlay renders above everything
  return <Portal>{content}</Portal>;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      web: {
        flex: 1,
      },
      default: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
      },
    }),
  },
  keyboardAvoidingView: {
    flex: 1,
    ...Platform.select({
      default: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
      },
    }),
  },
  overlay: {
    flex: 1,
    ...Platform.select({
      web: {
        // On web, overlay is contained within overlayContainer
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
      },
      default: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
      },
    }),
  },
  // backdrop style is created dynamically in component to access theme
  overlayContainer: {
    ...Platform.select({
      web: {
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        zIndex: 1000,
      },
      default: {},
    }),
  },
  searchBarContainer: {
    width: '100%',
    // MD3 Search View: Proper elevation for search bar container - per https://m3.material.io/components/search/guidelines
    ...Platform.select({
      web: {
        paddingBottom: SPACING.sm,
        // Web uses box-shadow instead of elevation
      },
      default: {
        paddingBottom: SPACING.xs,
        // MD3: elevation.level1 for search view header
        elevation: 1,
      },
    }),
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    gap: SPACING.xs,
  },
  searchBar: {
    flex: 1,
  },
  closeButton: {
    margin: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    // MD3 Search View: Proper content padding - per https://m3.material.io/components/search/guidelines
    paddingTop: SPACING.md,
    paddingBottom: SPACING.base,
    paddingHorizontal: SPACING.base,
  },
  skeletonContainer: {
    // Match BaseListWithHeader contentContainerStyle padding
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm, // M3: 8dp top padding for lists
    paddingBottom: SPACING.sm, // M3: 8dp bottom padding for lists
  },
});
