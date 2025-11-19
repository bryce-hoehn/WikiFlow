import { WIKIPEDIA_API_CONFIG } from '@/api/shared';
import { LAYOUT } from '@/constants/layout';
import { getRandomBlurhash } from '@/utils/blurhash';
import { extractFilenameFromUrl } from '@/utils/imageAltText';
import { cacheUrlResolution, getCachedUrlResolution } from '@/utils/imageUrlCache';
import { getOptimizedThumbnailUrl } from '@/utils/imageUtils';
import { Image, ImageContentFit } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ImageStyle, Platform, useWindowDimensions, View } from 'react-native';
import { TouchableRipple, useTheme } from 'react-native-paper';

interface ResponsiveImageProps {
  source: {
    source: string;
    height: number;
    width: number;
  };
  contentFit?: ImageContentFit;
  style?: ImageStyle;
  alt?: string;
  onPress?: (image: { uri: string; alt?: string }) => void; // Callback when image is pressed
  priority?: 'low' | 'normal' | 'high'; // Override default priority calculation
  isAboveFold?: boolean; // Whether image is above the fold (visible without scrolling)
  skipOptimization?: boolean; // If true, use the original thumbnail URL without optimization
}

const ResponsiveImage = React.memo(
  ({
    source,
    contentFit = 'cover',
    style = {},
    alt = '',
    onPress,
    priority: priorityOverride,
    isAboveFold = false,
    skipOptimization = false,
  }: ResponsiveImageProps) => {
    const theme = useTheme();
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const [hasTriedFallback, setHasTriedFallback] = useState(false);

    // Extract alt text from URL if not provided
    const finalAlt = useMemo(() => {
      if (alt && alt.trim()) {
        return alt.trim();
      }
      // Fallback: extract from filename
      if (source?.source) {
        const filename = extractFilenameFromUrl(source.source);
        return filename || 'Article image';
      }
      return 'Article image';
    }, [alt, source?.source]);

    const sourceUrl = source?.source;
    const sourceWidth = source?.width;
    const sourceHeight = source?.height;

    // Check if explicit dimensions are provided in style prop (for cards)
    // Handle both single style object and style array
    const styleObj = Array.isArray(style)
      ? style.reduce((acc, s) => ({ ...acc, ...s }), {})
      : style && typeof style === 'object'
        ? style
        : {};
    const explicitWidth = styleObj.width as number | undefined;
    const explicitHeight = styleObj.height as number | undefined;

    // If explicit dimensions are provided, use them (for card layouts)
    const useExplicitDimensions = explicitWidth !== undefined || explicitHeight !== undefined;

    // Calculate max dimensions for large screens (only if not using explicit dimensions)
    const isLargeScreen = windowWidth >= LAYOUT.DESKTOP_BREAKPOINT;
    const maxImageWidth = useExplicitDimensions
      ? explicitWidth || windowWidth
      : isLargeScreen
        ? Math.min(LAYOUT.ARTICLE_MAX_WIDTH, 900)
        : windowWidth;
    const maxImageHeight = useExplicitDimensions
      ? explicitHeight || 600
      : Math.min(600, windowHeight * 0.6); // Max 600px or 60% of screen height

    // Get optimized thumbnail URL for Wikimedia images, or use original
    // Check cache first to avoid trying URLs we know don't exist
    const imageUri = useMemo(() => {
      if (!sourceUrl || typeof sourceUrl !== 'string') return null;
      
      // Skip optimization if explicitly requested (e.g., for recommendation cards)
      if (skipOptimization) {
        return sourceUrl;
      }
      
      // Only optimize Wikimedia images
      if (sourceUrl.includes('upload.wikimedia.org') && !hasTriedFallback) {
        // Use the source width as preferred width, or calculate from window width
        const preferredWidth = sourceWidth || windowWidth || 800;
        const optimizedUrl = getOptimizedThumbnailUrl(sourceUrl, preferredWidth);
        
        // Check cache first - if we know it doesn't resolve, use original immediately
        const cachedResult = getCachedUrlResolution(optimizedUrl);
        if (cachedResult === false) {
          // Known to not exist, use original URL
          return sourceUrl;
        }
        
        // If cached as true, or not cached yet, try optimized URL
        // (will fallback on error if not cached)
        return optimizedUrl;
      }
      
      // Use original URL (either not Wikimedia, or fallback after failure)
      return sourceUrl;
    }, [sourceUrl, sourceWidth, windowWidth, hasTriedFallback, skipOptimization]);

    // Calculate image priority based on size, position, and importance
    // High priority for: large images, above-fold images, featured content
    // Low priority for: small thumbnails, below-fold content
    const imagePriority = useMemo(() => {
      // Allow explicit override
      if (priorityOverride) {
        return priorityOverride;
      }

      // High priority for:
      // 1. Large images (main article images, featured content)
      // 2. Above-fold images (visible without scrolling)
      if (isAboveFold || (sourceWidth > 400 || sourceHeight > 400)) {
        return 'high';
      }

      // Normal priority for:
      // 1. Medium-sized images
      // 2. Standard feed images
      if (sourceWidth > 200 || sourceHeight > 200) {
        return 'normal';
      }

      // Low priority for:
      // 1. Small thumbnails in lists
      // 2. Below-the-fold content
      return 'low';
    }, [priorityOverride, isAboveFold, sourceWidth, sourceHeight]);

    // Reset fallback state when source changes
    useEffect(() => {
      setHasTriedFallback(false);
    }, [sourceUrl]);

    // Use source dimensions directly, fallback to 1:1 aspect ratio if not available
    const effectiveWidth = sourceWidth || 1;
    const effectiveHeight = sourceHeight || 1;

    // Calculate constrained dimensions while maintaining aspect ratio
    const aspectRatio =
      effectiveWidth > 0 && effectiveHeight > 0 ? effectiveWidth / effectiveHeight : 1;

    let constrainedWidth =
      useExplicitDimensions && explicitWidth !== undefined ? explicitWidth : maxImageWidth;
    let constrainedHeight =
      useExplicitDimensions && explicitHeight !== undefined
        ? explicitHeight
        : constrainedWidth / aspectRatio;

    // If height exceeds max, constrain by height instead (only if not using explicit dimensions)
    if (!useExplicitDimensions && constrainedHeight > maxImageHeight) {
      constrainedHeight = maxImageHeight;
      constrainedWidth = constrainedHeight * aspectRatio;
    }

    const isValidImage = true;
    // Invalid images are silently skipped (no rendering)

    // Memoize image tap handler to prevent recreating on every render
    const handleImageTap = useCallback(() => {
      if (onPress && imageUri) {
        onPress({ uri: imageUri, alt: finalAlt });
      }
    }, [onPress, imageUri, finalAlt]);

    // Add headers for Android/iOS to help with Wikimedia image loading
    // Use the same headers as axiosInstance for consistency (User-Agent, Referer)
    // Web doesn't need headers, but native platforms may require Referer and User-Agent headers
    // MUST be called before any early returns to satisfy rules of hooks
    const imageSource = useMemo(() => {
      if (!imageUri) return null;
      
      if (Platform.OS === 'web') {
        return { uri: imageUri };
      }
      // For native platforms, use the same headers as axiosInstance
      return {
        uri: imageUri,
        headers: {
          Referer: 'https://en.wikipedia.org',
          'User-Agent': WIKIPEDIA_API_CONFIG.API_USER_AGENT,
          'Api-User-Agent': WIKIPEDIA_API_CONFIG.API_USER_AGENT,
        },
      };
    }, [imageUri]);

    // Early return only if image is invalid - but all hooks have been called
    // On Android, allow rendering even if dimensions aren't available yet (they'll be calculated from aspect ratio)
    if (!isValidImage || !imageUri) {
      return null;
    }

    return (
      <>
        <View style={useExplicitDimensions ? {} : { width: '100%', alignItems: 'center' }}>
          <TouchableRipple
            onPress={handleImageTap}
            disabled={!onPress}
            style={
              useExplicitDimensions
                ? {
                    width: constrainedWidth,
                    height: constrainedHeight,
                  }
                : {
                    width: constrainedWidth,
                    maxWidth: maxImageWidth,
                  }
            }
          >
            <View
              style={
                useExplicitDimensions
                  ? {
                      position: 'relative',
                      backgroundColor:
                        contentFit === 'contain' ? 'transparent' : theme.colors.surfaceVariant,
                      width: constrainedWidth,
                      height: constrainedHeight,
                    }
                  : {
                      position: 'relative',
                      backgroundColor:
                        contentFit === 'contain' ? 'transparent' : theme.colors.surfaceVariant, // Neutral background for transparent images
                      width: '100%',
                      maxHeight: maxImageHeight,
                    }
              }
            >
              {imageSource && (
              <Image
                source={imageSource}
                contentFit={contentFit}
                alt={finalAlt}
                accessibilityLabel={finalAlt}
                placeholder={{ blurhash: getRandomBlurhash(imageUri) }}
                transition={200}
                cachePolicy="memory-disk"
                priority={imagePriority}
                // Add crossOrigin for web to allow CORS requests to Wikipedia images
                {...(Platform.OS === 'web' && { crossOrigin: 'anonymous' as const })}
                // Increase timeout for slow connections (default is often too short for large images)
                {...(Platform.OS !== 'web' && { timeout: 30000 })} // 30 seconds for native platforms
                onError={(error) => {
                  // Silently handle image load failures - fallback mechanism will try original URL
                  // Only log in dev mode for debugging specific issues
                  if (__DEV__ && !hasTriedFallback) {
                    // Only log first attempt failures, not fallback attempts
                    console.warn('ResponsiveImage: Failed to load optimized URL, trying fallback');
                  }
                    
                    // Cache the failure to avoid retrying this URL
                    if (imageUri && imageUri.includes('upload.wikimedia.org')) {
                      cacheUrlResolution(imageUri, false);
                    }
                    
                    // If optimized URL failed and we haven't tried fallback yet, use original URL
                    if (!hasTriedFallback && sourceUrl && sourceUrl.includes('upload.wikimedia.org')) {
                      setHasTriedFallback(true);
                    }
                }}
                onLoad={() => {
                  // Cache the success to mark this URL as valid
                  if (imageUri && imageUri.includes('upload.wikimedia.org')) {
                    cacheUrlResolution(imageUri, true);
                  }
                }}
                style={[
                  useExplicitDimensions
                    ? {
                        width: constrainedWidth,
                        height: constrainedHeight,
                      }
                    : {
                        width: '100%',
                        height: constrainedHeight,
                        maxHeight: maxImageHeight,
                      },
                  style,
                ]}
              />
              )}
            </View>
          </TouchableRipple>
        </View>
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.source?.source === nextProps.source?.source &&
      prevProps.source?.width === nextProps.source?.width &&
      prevProps.source?.height === nextProps.source?.height &&
      prevProps.alt === nextProps.alt &&
      prevProps.onPress === nextProps.onPress &&
      prevProps.contentFit === nextProps.contentFit
    );
  }
);

export default ResponsiveImage;
