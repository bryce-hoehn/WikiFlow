import { useCallback, useContext } from 'react';
import { BookmarksContext } from '../../context/BookmarksContext';
import { SnackbarContext } from '../../context/SnackbarContext';
import { RecommendationItem } from '../../types/components';

/**
 * Shared hook for bookmark toggle functionality
 * Eliminates duplicate bookmark toggle logic across components
 * Gracefully handles missing context (e.g., in Portal outside provider tree)
 */
export default function useBookmarkToggle() {
  const bookmarksContext = useContext(BookmarksContext);
  const snackbarContext = useContext(SnackbarContext);
  
  // If context is not available, return no-op functions
  if (!bookmarksContext) {
    return {
      handleBookmarkToggle: () => Promise.resolve(),
      isBookmarked: () => false,
    };
  }
  
  const { addBookmark, removeBookmark, isBookmarked } = bookmarksContext;
  const { showSuccess } = snackbarContext || { showSuccess: () => {} };

  const handleBookmarkToggle = useCallback(
    async (item: RecommendationItem) => {
      const bookmarked = isBookmarked(item.title);

      try {
        if (bookmarked) {
          await removeBookmark(item.title);
          showSuccess('Article removed from bookmarks');
        } else {
          await addBookmark(item.title, item.thumbnail, item.description);
          showSuccess('Article bookmarked');
        }
      } catch (error) {
        // Error handling is done by the context
      }
    },
    [addBookmark, removeBookmark, isBookmarked, showSuccess]
  );

  return {
    handleBookmarkToggle,
    isBookmarked,
  };
}
