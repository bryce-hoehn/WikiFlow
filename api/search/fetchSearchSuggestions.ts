import { PageInfo, RawSearchResult, SearchSuggestion } from '../../types/api';
import { actionAxiosInstance, WIKIPEDIA_API_CONFIG } from '../shared';

interface CombinedSearchResponse {
  query?: {
    search?: RawSearchResult[];
    pages?: Record<string, PageInfo>;
  };
}

/**
 * Fetch search suggestions from Wikipedia based on a query string
 *
 * Returns up to 10 search suggestions with titles, descriptions, and thumbnails.
 * Returns an empty array if the query is empty or if the request fails.
 *
 * @param query - The search query string
 * @returns Promise resolving to an array of SearchSuggestion objects
 *
 * @example
 * ```ts
 * const suggestions = await fetchSearchSuggestions("Einstein");
 * suggestions.forEach(s => console.log(s.title));
 * ```
 */
export const fetchSearchSuggestions = async (query: string): Promise<SearchSuggestion[]> => {
  if (!query.trim()) return [];

  try {
    const params = {
      action: 'query',
      generator: 'search',
      gsrsearch: query,
      gsrlimit: 10,
      prop: 'pageimages|description',
      piprop: 'thumbnail',
      pithumbsize: 200,
      pilimit: 10,
      format: 'json',
      origin: '*',
    };

    const searchResponse = await actionAxiosInstance.get<CombinedSearchResponse>('', {
      baseURL: WIKIPEDIA_API_CONFIG.BASE_URL,
      params,
    });
    const searchData = searchResponse.data;
    const pages = searchData.query?.pages || {};

    if (Object.keys(pages).length === 0) return [];

    const results = Object.values(pages)
      .filter((page): page is PageInfo => 'title' in page)
      .sort((a, b) => (a.index || 0) - (b.index || 0));

    return results.map((pageInfo: PageInfo) => {
      return {
        title: pageInfo.title,
        description: pageInfo.description || '',
        image: pageInfo.thumbnail?.source,
      };
    });
  } catch (error: unknown) {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.error('Failed to fetch search suggestions:', error);
    }
    return [];
  }
};
