import { axiosInstance, WIKIPEDIA_API_CONFIG } from '@/api/shared';
import { Article } from '@/types/api';
import { isAxiosError } from '@/types/api/base';
import { normalizeWikipediaTitle } from '@/utils/titleNormalization';

/**
 * Resolve redirects by fetching the article summary, which automatically resolves redirects
 * Returns the canonical title if found, or the original title if no redirect exists
 */
async function resolveRedirect(title: string): Promise<string> {
  try {
    const cleanTitle = normalizeWikipediaTitle(title);

    // Use REST API summary endpoint which automatically resolves redirects
    const response = await axiosInstance.get<Article>(
      `/page/summary/${encodeURIComponent(cleanTitle)}`,
      {
        baseURL: WIKIPEDIA_API_CONFIG.REST_API_BASE_URL,
      }
    );

    // REST API returns titles with spaces, but Core API expects underscores
    if (response.data?.title) {
      return normalizeWikipediaTitle(response.data.title);
    }

    // If no title in response, return original
    return cleanTitle;
  } catch (error) {
    // If redirect resolution fails, return original title and let HTML fetch handle the error
    return normalizeWikipediaTitle(title);
  }
}

/**
 * Fetch full HTML content for a Wikipedia article using the Wikimedia Core API
 *
 * Used for article detail pages where complete HTML with images is needed.
 * Automatically handles redirects by resolving them first to get the canonical title.
 *
 * @param title - The Wikipedia article title (e.g., "Albert Einstein")
 * @returns Promise resolving to the HTML string, or null if the article cannot be fetched
 *
 * @example
 * ```ts
 * const html = await fetchArticleHtml("Albert Einstein");
 * if (html) {
 *   // Render the HTML content
 * }
 * ```
 */
export const fetchArticleHtml = async (title: string): Promise<string | null> => {
  try {
    const cleanTitle = normalizeWikipediaTitle(title);

    // Resolve redirects and fetch HTML in parallel for better performance
    // Start both requests simultaneously
    const [resolvedTitle, directHtmlResponse] = await Promise.allSettled([
      resolveRedirect(cleanTitle),
      axiosInstance.get<string>(`/page/${encodeURIComponent(cleanTitle)}/html`, {
        baseURL: WIKIPEDIA_API_CONFIG.CORE_API_BASE_URL,
        headers: {
          Accept: 'text/html',
        },
      }),
    ]);

    // If direct fetch succeeded, use it (avoids redirect resolution delay)
    if (directHtmlResponse.status === 'fulfilled' && directHtmlResponse.value.status === 200) {
      return directHtmlResponse.value.data;
    }

    // Otherwise, use resolved title (handles redirects)
    const finalTitle =
      resolvedTitle.status === 'fulfilled'
        ? normalizeWikipediaTitle(resolvedTitle.value)
        : cleanTitle;

    // Fetch with resolved title
    const response = await axiosInstance.get<string>(
      `/page/${encodeURIComponent(finalTitle)}/html`,
      {
        baseURL: WIKIPEDIA_API_CONFIG.CORE_API_BASE_URL,
        headers: {
          Accept: 'text/html',
        },
        // Uses centralized timeout from axiosInstance
      }
    );

    return response.data;
  } catch (error: unknown) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      if (isAxiosError(error)) {
        console.error(
          'Failed to fetch article HTML:',
          title,
          error.response?.status,
          error.response?.data
        );

        if (error.response?.status === 404) {
          console.error(
            `Article not found: "${title}" - The page may not exist or the title format is incorrect`
          );
        } else if (error.code === 'ECONNABORTED') {
          console.error('Request timeout while fetching article HTML');
        } else if (error.response?.status && error.response.status >= 500) {
          console.error('Server error while fetching article HTML');
        }
      } else {
        console.error('Failed to fetch article HTML:', title, error);
      }
    }

    return null;
  }
};
