import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, isAxiosError } from 'axios';
import { Platform } from 'react-native';

/**
 * Wikipedia API Configuration
 *
 * Single Axios instance for all Wikipedia API calls with client-side rate limiting
 * Wikipedia's public APIs are generally tolerant of reasonable usage
 */

// Wikipedia API configuration
export const WIKIPEDIA_API_CONFIG = {
  API_USER_AGENT: 'WikipediaExpo/0.1 (bryce.hoehn@mailbox.org)',
  BASE_URL: 'https://en.wikipedia.org/w/api.php',
  WIKIMEDIA_BASE_URL: 'https://api.wikimedia.org',
  REST_API_BASE_URL: 'https://en.wikipedia.org/api/rest_v1',
  CORE_API_BASE_URL: 'https://api.wikimedia.org/core/v1/wikipedia/en',
};

// Utility: simple delay helper used by retry/backoff logic
export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Rate limiting configuration (200 requests per second = 5ms between requests)
const RATE_LIMIT_CONFIG = {
  REQUESTS_PER_SECOND: 200,
  MIN_INTERVAL_MS: 5, // 1000ms / 200 = 5ms minimum between requests
};

// Simple rate limiting state
let lastRequestTime = 0;

// Set headers for Wikipedia API
const headers: Record<string, string> = {
  'Accept': 'application/json',
};

if (Platform.OS !== 'web') {
  headers['Api-User-Agent'] = WIKIPEDIA_API_CONFIG.API_USER_AGENT;
  headers['User-Agent'] = WIKIPEDIA_API_CONFIG.API_USER_AGENT;
}

// Single Axios instance for all Wikipedia API calls
export const axiosInstance: AxiosInstance = axios.create({
  headers,
  withCredentials: false,
  timeout: 8000, // Reduced from 10s to 8s for better UX
});

// Add rate limiting to request interceptor
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < RATE_LIMIT_CONFIG.MIN_INTERVAL_MS) {
      const waitTime = RATE_LIMIT_CONFIG.MIN_INTERVAL_MS - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    lastRequestTime = Date.now();
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

// Handle rate limit errors gracefully with improved retry logic
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    if (isAxiosError(error)) {
      // Handle rate limiting (429)
      if (error.response?.status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '1', 10) * 1000;
        console.warn(`Rate limited by Wikipedia API. Retrying after ${retryAfter}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter));
        return axiosInstance.request(error.config as InternalAxiosRequestConfig);
      }
      
      // Handle server errors (5xx) with retry
      if (error.response?.status && error.response.status >= 500) {
        console.warn(`Server error ${error.response.status}. Retrying after 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return axiosInstance.request(error.config as InternalAxiosRequestConfig);
      }
    }
    return Promise.reject(error);
  }
);

// Rate-limited concurrent fetching
export const fetchConcurrently = async <T, R>(
  items: T[],
  requestFn: (item: T) => Promise<R>
): Promise<R[]> => {
  const fulfilledResults: R[] = [];
  
  // Process items sequentially with rate limiting
  for (const item of items) {
    try {
      const result = await requestFn(item);
      fulfilledResults.push(result);
    } catch (error) {
      // Skip failed requests but continue with others
      console.warn('[RateLimitDebug] Request failed in fetchConcurrently:', error);
    }
  }
  
  return fulfilledResults;
};
