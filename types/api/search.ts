/**
 * Type definitions for Wikipedia search-related APIs
 */

import { ImageThumbnail, PageMetadata } from './base';

/**
 * Search suggestion from Wikipedia API
 */
export interface SearchSuggestion {
  title: string;
  description?: string;
  image?: string;
}

/**
 * Raw search result from Wikipedia API
 */
export interface RawSearchResult extends PageMetadata {
  snippet?: string;
  size?: number;
  wordcount?: number;
  timestamp?: string;
}

/**
 * Page info with images from Wikipedia API
 */
export interface PageInfo extends PageMetadata {
  thumbnail?: ImageThumbnail;
  pageimage?: string;
  description?: string;
  descriptionsource?: string;
  index?: number; // Used when returned from generator=search
}

/**
 * Response from fetchSearchSuggestions API
 */
export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
  error?: string;
}

/**
 * Raw API response for search
 */
export interface RawSearchResponse {
  query?: {
    search?: RawSearchResult[];
  };
}

/**
 * Raw API response for page info
 */
export interface RawPageInfoResponse {
  query?: {
    pages?: Record<string, PageInfo>;
  };
}
