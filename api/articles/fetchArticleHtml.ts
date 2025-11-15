import { axiosInstance, WIKIPEDIA_API_CONFIG } from '../shared';

/**
 * Fetch full HTML content for a Wikipedia article using the Wikimedia Core API
 * Used for article detail pages where complete HTML with images is needed
 */
export const fetchArticleHtml = async (title: string): Promise<string | null> => {
  try {
    // Clean and normalize the title before encoding
    const cleanTitle = title
      .trim()
      .replace(/\s+/g, '_') // Replace spaces with underscores (Wikipedia format)
      .replace(/%20/g, '_') // Replace URL-encoded spaces with underscores
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
    
    
    // Try Core API first (preferred for better HTML formatting)
    try {
      const response = await axiosInstance.get<string>(`/page/${encodeURIComponent(cleanTitle)}/html`, {
        baseURL: WIKIPEDIA_API_CONFIG.CORE_API_BASE_URL,
        headers: {
          'Accept': 'text/html'
        },
        // Uses centralized 8s timeout from axiosInstance
      });
      
      return response.data;
    } catch (coreError: unknown) {
      console.warn(`Core API failed for "${title}", trying REST API mobile-html fallback:`, (coreError as { response?: { status?: number } }).response?.status);
      return null
    }
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number; data?: unknown }; code?: string };
    console.error('Failed to fetch article HTML:', title, axiosError.response?.status, axiosError.response?.data);
    
    // Provide more detailed error information
    if (axiosError.response?.status === 404) {
      console.error(`Article not found: "${title}" - The page may not exist or the title format is incorrect`);
    } else if (axiosError.code === 'ECONNABORTED') {
      console.error('Request timeout while fetching article HTML');
    } else if (axiosError.response?.status && axiosError.response.status >= 500) {
      console.error('Server error while fetching article HTML');
    }
    
    return null;
  }
};