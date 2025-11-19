/**
 * URL resolution cache utilities
 * Used to cache image URL resolution results from prefetch/load attempts
 */

/**
 * Cache entry for URL resolution results
 */
interface CacheEntry {
  resolves: boolean;
  timestamp: number;
}

/**
 * In-memory cache for URL resolution results
 * Key: optimized URL, Value: cache entry
 */
const urlResolutionCache = new Map<string, CacheEntry>();

/**
 * Cache TTL: 1 hour (URLs don't change often)
 */
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Maximum cache size to prevent memory issues
 */
const MAX_CACHE_SIZE = 1000;

/**
 * Get cached URL resolution result
 * 
 * @param url - URL to check in cache
 * @returns true if URL resolves, false if it doesn't, undefined if not cached
 */
export function getCachedUrlResolution(url: string): boolean | undefined {
  if (!url) return undefined;

  const entry = urlResolutionCache.get(url);
  if (!entry) return undefined;

  // Check if cache entry is still valid
  const age = Date.now() - entry.timestamp;
  if (age >= CACHE_TTL) {
    // Expired, remove it
    urlResolutionCache.delete(url);
    return undefined;
  }

  return entry.resolves;
}

/**
 * Cache a URL resolution result
 * 
 * @param url - URL that was checked
 * @param resolves - Whether the URL resolves (true) or not (false)
 */
export function cacheUrlResolution(url: string, resolves: boolean): void {
  if (!url) return;

  // Implement LRU-like eviction when cache exceeds max size
  if (urlResolutionCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entries (simple approach: remove first 100 entries)
    let removed = 0;
    for (const [key] of urlResolutionCache) {
      urlResolutionCache.delete(key);
      removed++;
      if (removed >= 100) break;
    }
  }

  urlResolutionCache.set(url, {
    resolves,
    timestamp: Date.now(),
  });
}


