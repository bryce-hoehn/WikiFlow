import { Article, ArticleResponse } from '../../types/api';
import { isAxiosError } from '../../types/api/base';
import { axiosInstance, WIKIPEDIA_API_CONFIG } from '../shared';

/**
 * Fetch a Wikipedia article summary by title
 * Used for recommendation cards, search results, etc.
 */
export const fetchArticleSummary = async (title: string): Promise<ArticleResponse> => {
  try {
    // Clean and normalize the title before encoding
    const cleanTitle = title
      .trim()
      .replace(/\s+/g, '_') // Replace spaces with underscores (Wikipedia format)
      .replace(/%20/g, '_') // Replace URL-encoded spaces with underscores
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
    
    
    const response = await axiosInstance.get<Article>(`/page/summary/${encodeURIComponent(cleanTitle)}`, {
      baseURL: WIKIPEDIA_API_CONFIG.REST_API_BASE_URL,
      // Uses centralized 8s timeout from axiosInstance
    });
    
    return { article: response.data };
  } catch (error: unknown) {
    console.error('Failed to fetch article summary:', title, error);

    // Provide more detailed error information
    if (isAxiosError(error)) {
      if (error.response?.status === 404) {
        console.error(`Article not found: "${title}" - The page may not exist or the title format is incorrect`);
        return { article: null, error: `Article "${title}" not found` };
      } else if (error.code === 'ECONNABORTED') {
        console.error('Request timeout while fetching article summary');
        return { article: null, error: 'Request timeout' };
      } else if (error.response?.status && error.response.status >= 500) {
        console.error('Server error while fetching article summary');
        return { article: null, error: 'Server error' };
      }
    }
    
    return { article: null, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
};