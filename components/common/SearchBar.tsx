import { LAYOUT } from '@/constants/layout';
import { SPACING } from '@/constants/spacing';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, TextInput, View, ViewStyle, useWindowDimensions } from 'react-native';
import { Portal, Searchbar, useTheme } from 'react-native-paper';
import { useDebounce, useSearchSuggestions, useVisitedArticles } from '../../hooks';
import NoResultsState from '../search/NoResultsState';
import RecentArticlesList from '../search/RecentArticlesList';
import SearchOverlay from '../search/SearchOverlay';
import SearchResultSkeleton from '../search/SearchResultSkeleton';
import SearchResultsList from '../search/SearchResultsList';

interface SearchBarProps {
  value?: string;
  onChangeText?: (query: string) => void;
  onIconPress?: () => void;
  onSubmitEditing?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  headerStyle?: boolean;
  autoFocus?: boolean;
  style?: ViewStyle;
  disableOverlay?: boolean;
}

/**
 * Material Design 3 compliant SearchBar component
 * - Large screens/web: Shows docked dropdown below search bar
 * - Mobile: Shows full-screen SearchView overlay
 */
export default function SearchBar({
  value: controlledValue,
  onChangeText: controlledOnChangeText,
  onIconPress,
  onSubmitEditing,
  onFocus,
  onBlur,
  placeholder = 'Search Wikipedia',
  headerStyle = false,
  autoFocus = false,
  style,
  disableOverlay = false,
}: SearchBarProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= LAYOUT.DESKTOP_BREAKPOINT;
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<TextInput>(null);
  const searchBarRef = useRef<View>(null);
  const isNavigatingRef = useRef(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Controlled or uncontrolled state
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const onChangeText = controlledOnChangeText || setInternalValue;

  // Search suggestions for dropdown
  const debouncedQuery = useDebounce(value || '', 300);
  const { data: suggestions, isLoading: isLoadingSuggestions } = useSearchSuggestions(debouncedQuery);
  const { visitedArticles } = useVisitedArticles();
  
  const safeSuggestions = suggestions || [];
  const hasQuery = debouncedQuery.trim().length > 2;
  const showSuggestions = safeSuggestions.length > 0 && !isLoadingSuggestions && hasQuery;
  const showNoResults = hasQuery && safeSuggestions.length === 0 && !isLoadingSuggestions;
  const recentVisitedArticles = useMemo(() => visitedArticles.slice(0, 10), [visitedArticles]);
  const showRecent = recentVisitedArticles.length > 0 && !showSuggestions && !showNoResults && !isLoadingSuggestions;

  const measureSearchBarPosition = () => {
    if (searchBarRef.current) {
      searchBarRef.current.measure((x, y, width, height, pageX, pageY) => {
        setDropdownPosition({
          top: pageY + height + 4,
          left: pageX,
          width: width,
        });
      });
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Clear any pending blur timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }

    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      onFocus?.();
      return;
    }
    if (!disableOverlay) {
      if (isLargeScreen) {
        setTimeout(() => measureSearchBarPosition(), 0);
        setShowDropdown(true);
      } else {
        setShowMobileOverlay(true);
      }
    }
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    // On large screens, delay closing dropdown to allow clicks inside dropdown
    // Dropdown closes via close button or clicking outside backdrop
    if (isLargeScreen) {
      blurTimeoutRef.current = setTimeout(() => {
        // Only close if dropdown is still open and user hasn't clicked inside
        setShowDropdown(false);
      }, 200);
    }
    onBlur?.();
  };

  const handleSuggestionClick = (title: string) => {
    onChangeText(title);
    isNavigatingRef.current = true;
    if (isLargeScreen) {
      setShowDropdown(false);
    } else {
      setShowMobileOverlay(false);
    }
    inputRef.current?.blur();
    router.push(`/article/${encodeURIComponent(title)}`);
  };

  const handleIconPress = () => {
    if (!disableOverlay) {
      if (isLargeScreen) {
        setTimeout(() => measureSearchBarPosition(), 0);
        setShowDropdown(true);
      } else {
        setShowMobileOverlay(true);
      }
    }
    inputRef.current?.focus();
    onIconPress?.();
  };

  const handleClear = (e?: any) => {
    e?.stopPropagation?.();
    onChangeText('');
    inputRef.current?.focus();
  };

  const handleBackPress = () => {
    setIsFocused(false);
    if (isLargeScreen) {
      setShowDropdown(false);
    } else {
      setShowMobileOverlay(false);
    }
    inputRef.current?.blur();
  };

  const handleOverlayClose = useCallback(() => {
    setIsFocused(false);
    if (isLargeScreen) {
      setShowDropdown(false);
    } else {
      setShowMobileOverlay(false);
    }
    inputRef.current?.blur();
  }, [isLargeScreen]);

  const handleSuggestionClickDocked = useCallback((title: string) => {
    onChangeText(title);
    isNavigatingRef.current = true;
    setShowDropdown(false);
    inputRef.current?.blur();
    router.push(`/article/${encodeURIComponent(title)}`);
  }, [onChangeText]);

  const handleSubmit = () => {
    if (isLargeScreen) {
      onSubmitEditing?.();
    } else {
      if (!showMobileOverlay && !disableOverlay) {
        setShowMobileOverlay(true);
      } else {
        onSubmitEditing?.();
      }
    }
  };

  // MD3 SearchBar styling - per https://m3.material.io/components/search/specs
  // Height: 56dp, Background: surfaceVariant, Elevation: 2dp, Corner radius: 12dp (corner.medium)
  const elevation = Platform.select({ android: 2, ios: 0, web: 2 });
  const backgroundColor = theme.colors.surfaceVariant;

  return (
    <View style={[style, { position: 'relative', zIndex: 10000 }]}>
      <View ref={searchBarRef} onLayout={measureSearchBarPosition}>
        <Searchbar
          ref={inputRef}
          placeholder={placeholder}
          value={value || ''}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          onIconPress={() => {
            // If showing back arrow (dropdown/overlay open), close it
            // If showing magnify icon, open overlay/dropdown
            if (showDropdown || showMobileOverlay) {
              handleBackPress();
            } else {
              handleIconPress();
            }
          }}
          onClearIconPress={handleClear}
          clearIcon={value && value.length > 0 && isFocused ? 'close' : undefined}
          icon={(isFocused || showDropdown || showMobileOverlay) ? 'arrow-left' : 'magnify'}
          mode="bar"
          style={{
            elevation,
            backgroundColor,
            borderRadius: theme.roundness * 3, // 12dp (corner.medium)
            minHeight: 56, // MD3: 56dp height
            height: 56,
          }}
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
            value && value.length > 0
              ? `Searching for "${value}". Press enter to search or tap to view suggestions.`
              : 'Enter search terms to find Wikipedia articles. Tap to view suggestions.'
          }
          autoFocus={autoFocus}
          returnKeyType="search"
          {...(Platform.OS === 'web' && {
            autoComplete: 'off',
            autoCorrect: false,
            spellCheck: false,
          })}
          {...(Platform.OS === 'android' && {
            autoComplete: 'off',
            importantForAutofill: 'no',
          })}
        />
      </View>

      {/* Large screens/web: Docked SearchView dropdown */}
      {isLargeScreen && showDropdown && !disableOverlay && dropdownPosition.width > 0 && (
        <Portal>
          {/* Backdrop to close dropdown when clicking outside - positioned below search bar */}
          <View
            style={{
              ...Platform.select({
                web: {
                  position: 'fixed' as any,
                  top: dropdownPosition.top + 4,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9998,
                  backgroundColor: 'transparent',
                  pointerEvents: 'auto' as any,
                },
              }),
            }}
            onStartShouldSetResponder={() => true}
            onResponderRelease={handleOverlayClose}
            {...(Platform.OS === 'web' && {
              onClick: handleOverlayClose,
            })}
          />
          <View
            style={[
              styles.dockedSearchView,
              {
                backgroundColor: theme.colors.surface,
                ...Platform.select({
                  web: {
                    position: 'fixed' as any,
                    top: dropdownPosition.top + 4,
                    left: dropdownPosition.left,
                    width: dropdownPosition.width,
                    zIndex: 9999,
                    boxShadow: `0 8px 16px ${theme.colors.shadow}33`,
                    maxHeight: 600,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.colors.outlineVariant + '40',
                  },
                  default: {
                    elevation: 8,
                  },
                }),
              },
            ]}
            onStartShouldSetResponder={() => false}
            onResponderGrant={() => {
              // Cancel blur timeout when clicking inside dropdown
              if (blurTimeoutRef.current) {
                clearTimeout(blurTimeoutRef.current);
                blurTimeoutRef.current = null;
              }
            }}
            {...(Platform.OS === 'web' && {
              onClick: (e: any) => {
                e.stopPropagation();
                // Cancel blur timeout when clicking inside dropdown
                if (blurTimeoutRef.current) {
                  clearTimeout(blurTimeoutRef.current);
                  blurTimeoutRef.current = null;
                }
              },
              onMouseDown: () => {
                // Cancel blur timeout when clicking inside dropdown
                if (blurTimeoutRef.current) {
                  clearTimeout(blurTimeoutRef.current);
                  blurTimeoutRef.current = null;
                }
              },
            })}
          >
            {/* Results area */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              accessibilityRole="list"
              accessibilityLabel={
                showSuggestions
                  ? `${safeSuggestions.length} search results found`
                  : showNoResults
                    ? 'No search results found'
                    : showRecent
                      ? `${recentVisitedArticles.length} recently viewed articles`
                      : 'Search results'
              }
            >
              {isLoadingSuggestions && debouncedQuery.length > 2 && (
                <View style={styles.skeletonContainer}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <SearchResultSkeleton key={`skeleton-${index}`} index={index} />
                  ))}
                </View>
              )}

              {showSuggestions && (
                <SearchResultsList
                  suggestions={safeSuggestions}
                  onSuggestionClick={handleSuggestionClickDocked}
                  query={debouncedQuery}
                />
              )}

              {showNoResults && (
                <View accessibilityRole="alert" accessibilityLabel={`No results found for "${value}"`}>
                  <NoResultsState query={value || ''} onClearSearch={handleOverlayClose} />
                </View>
              )}

              {showRecent && (
                <RecentArticlesList
                  recentVisitedArticles={recentVisitedArticles}
                  onSuggestionClick={handleSuggestionClickDocked}
                />
              )}
            </ScrollView>
          </View>
        </Portal>
      )}

      {/* Mobile: Full-screen SearchView overlay */}
      {!isLargeScreen && (
        <SearchOverlay
          visible={showMobileOverlay && !disableOverlay}
          onClose={handleOverlayClose}
          initialQuery={value || ''}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dockedSearchView: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  searchBarContainer: {
    width: '100%',
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
    paddingTop: 0,
    paddingBottom: SPACING.sm,
  },
  skeletonContainer: {
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
});

