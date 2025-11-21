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
  useWindowDimensions,
} from 'react-native';
import { Portal, Searchbar, useTheme } from 'react-native-paper';
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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const { visitedArticles } = useVisitedArticles();
  const searchInputRef = useRef<TextInput>(null);
  const showingBackArrowRef = useRef(false);
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

  const handleSearchSubmit = useCallback(async () => {
    if (query.trim()) {
      // Try to find best match (exact or fuzzy)
      const { findBestArticleMatch } = await import('@/utils/fuzzyArticleSearch');
      const bestMatch = await findBestArticleMatch(query);
      if (bestMatch) {
        router.push(`/article/${encodeURIComponent(bestMatch)}`);
        onClose();
      } else {
        // Show error if no match found - could show a snackbar here
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.warn('No article found for query:', query);
        }
      }
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
    setIsFocused(false);
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
          {/* MD3 SearchView: Search bar container - per https://m3.material.io/components/search/specs */}
          <View
            style={[
              styles.searchBarContainer,
              {
                paddingTop: insets.top,
                backgroundColor: theme.colors.surface,
                height: 56 + insets.top,
                ...Platform.select({
                  web: {
                    boxShadow: `0 1px 3px ${theme.colors.shadow}1A`,
                  },
                }),
              },
            ]}
          >
            <View
              style={[
                styles.searchBarWrapper,
                { 
                  justifyContent: 'center', 
                  flex: 1, 
                  minHeight: 56,
                  height: 56,
                  paddingHorizontal: Platform.OS === 'web' ? SPACING.base : SPACING.sm,
                },
              ]}
              pointerEvents="box-none"
            >
              <Searchbar
                ref={searchInputRef}
                placeholder="Search Wikipedia"
                value={query}
                onChangeText={setQuery}
                onFocus={() => {
                  setIsFocused(true);
                  showingBackArrowRef.current = true;
                }}
                onBlur={() => {
                  // Delay to allow icon press to register
                  setTimeout(() => {
                    setIsFocused(false);
                    showingBackArrowRef.current = false;
                  }, 200);
                }}
                onSubmitEditing={handleSearchSubmit}
                onIconPress={() => {
                  // Back arrow is always visible when search view is open, so always close
                  if (visible) {
                    handleClose();
                  }
                }}
                onClearIconPress={() => {
                  setQuery('');
                  searchInputRef.current?.focus();
                }}
                clearIcon={
                  Platform.OS === 'android'
                    ? undefined
                    : query && query.length > 0
                      ? 'close'
                      : undefined
                }
                icon={visible ? 'arrow-left' : 'magnify'}
                mode="bar"
                style={[
                  styles.searchBar,
                  {
                    elevation: 0,
                    backgroundColor: 'transparent',
                    borderRadius: 0,
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
            </View>
          </View>

          <ScrollView
            style={[
              styles.scrollView,
              Platform.OS !== 'web' && {
                // MD3: Account for 56dp search bar + safe area
                maxHeight: windowHeight - (56 + insets.top),
              },
            ]}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingHorizontal: Platform.OS === 'web' 
                  ? SPACING.base 
                  : Math.min(SPACING.sm, windowWidth * 0.03),
              },
            ]}
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

  // On web, use Portal with backdrop for full-screen overlay
  const backdropStyle = Platform.select({
    web: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.scrim + '80',
      zIndex: 999,
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
          {...(Platform.OS === 'web' && {
            onClick: handleBackdropPress,
            onMouseDown: (e: any) => {
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
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 1000,
      },
      default: {},
    }),
  },
  searchBarContainer: {
    width: '100%',
    ...Platform.select({
      web: {
        paddingBottom: SPACING.sm,
      },
      default: {
        paddingBottom: SPACING.xs,
        elevation: 1,
      },
    }),
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    // paddingHorizontal will be set dynamically based on platform
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
    // paddingHorizontal will be set dynamically based on screen width
  },
  skeletonContainer: {
    // Match BaseListWithHeader contentContainerStyle padding
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm, // M3: 8dp top padding for lists
    paddingBottom: SPACING.sm, // M3: 8dp bottom padding for lists
  },
});
