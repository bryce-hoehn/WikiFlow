import { fetchSearchSuggestions } from '@/api';
import { fetchArticleSummaries } from '@/api/articles/fetchArticleSummary';

/**
 * Finds the best matching article for a search query
 * First tries exact match, then falls back to search suggestions
 * 
 * @param query - The search query
 * @returns The best matching article title, or null if no match found
 */
export async function findBestArticleMatch(query: string): Promise<string | null> {
  if (!query.trim()) return null;

  const normalizedQuery = query.trim();
  
  // First, try exact match
  try {
    const articles = await fetchArticleSummaries([normalizedQuery]);
    // Check if we got a result (the key might be normalized, so check all values)
    const article = Object.values(articles)[0];
    if (article && article.title) {
      return article.title;
    }
  } catch (error) {
    // Article doesn't exist, continue to fuzzy search
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.debug('Exact match failed, trying fuzzy search:', error);
    }
  }

  // If exact match fails, use search suggestions
  try {
    const suggestions = await fetchSearchSuggestions(normalizedQuery);
    if (suggestions.length > 0) {
      // Return the first (most relevant) suggestion
      return suggestions[0].title;
    }
  } catch (error) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('Failed to fetch search suggestions:', error);
    }
  }

  return null;
}

