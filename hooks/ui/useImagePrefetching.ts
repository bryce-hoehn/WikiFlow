import { Image } from 'expo-image';
import { useCallback } from 'react';
import { cacheUrlResolution, getCachedUrlResolution } from '../../utils/imageUrlCache';
import { getOptimizedThumbnailUrl } from '../../utils/imageUtils';

/**
 * Hook for prefetching images for items about to become visible in FlashList
 * 
 * @template T - The type of items in the list
 * @param data - Array of items to prefetch images for
 * @param getImageUrl - Function to extract image URL from an item
 * @param preferredWidth - Preferred width for optimized thumbnail URLs
 * @returns Object with onViewableItemsChanged callback for FlashList
 */
export function useImagePrefetching<T>({
  data,
  getImageUrl,
  preferredWidth,
}: {
  data: T[];
  getImageUrl: (item: T) => string | undefined;
  preferredWidth: number;
}) {
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ item: T; index: number }> }) => {
      if (viewableItems.length === 0 || data.length === 0) return;

      // Prefetch images for items about to become visible (2-3 items ahead)
      const lastVisibleIndex = viewableItems[viewableItems.length - 1]?.index;
      if (lastVisibleIndex === undefined || lastVisibleIndex >= data.length - 1) return;

      const prefetchStartIndex = lastVisibleIndex + 1;
      const prefetchEndIndex = Math.min(lastVisibleIndex + 4, data.length); // Prefetch 3 items ahead

      for (let i = prefetchStartIndex; i < prefetchEndIndex; i++) {
        const item = data[i];
        const imageUrl = getImageUrl(item);

        // Only prefetch Wikimedia images
        if (!imageUrl?.includes('upload.wikimedia.org')) continue;

        const optimizedUrl = getOptimizedThumbnailUrl(imageUrl, preferredWidth);

        // Only prefetch if URL is known to exist (from cache) or we haven't checked yet
        // Don't prefetch if we know it doesn't exist
        const cachedResult = getCachedUrlResolution(optimizedUrl);
        // Prefetch if: not checked yet (undefined) or known to exist (true)
        // Skip if: known to not exist (false)
        if (cachedResult !== false) {
          // Prefetch using expo-image's prefetch
          // This will cache the image in memory/disk for faster loading when it becomes visible
          // If prefetch fails, cache the failure to avoid retrying
          Image.prefetch(optimizedUrl, {
            cachePolicy: 'memory-disk',
          })
            .then(() => {
              // Prefetch succeeded - cache that URL exists
              cacheUrlResolution(optimizedUrl, true);
            })
            .catch(() => {
              // Prefetch failed - cache that URL doesn't exist
              cacheUrlResolution(optimizedUrl, false);
            });
        }
      }
    },
    [data, getImageUrl, preferredWidth]
  );

  return { onViewableItemsChanged };
}

