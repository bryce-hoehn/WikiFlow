import { fetchArticleBacklinks, fetchArticleLinks, fetchArticleSummary } from '@/api';
import useVisitedArticles from '@/hooks/storage/useVisitedArticles';
import { RecommendationItem } from '@/types/components';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

/**
 * Hook for generating article recommendations using Wikipedia's linkshere API
 * This provides highly relevant recommendations based on articles that link to visited articles
 */
export default function useBacklinkRecommendations() {
  const { visitedArticles } = useVisitedArticles();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get a random visited article
  const getRandomVisitedArticle = useCallback(() => {
    if (visitedArticles.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * visitedArticles.length);
    return visitedArticles[randomIndex];
  }, [visitedArticles]);

  // Get a random backlink from a visited article
  // Uses React Query for caching
  const getRandomBacklink = useCallback(
    async (visitedArticleTitle: string, visitedTitlesSet: Set<string>) => {
      try {
        // Use React Query to fetch and cache backlinks
        const backlinkTitles = await queryClient.fetchQuery({
          queryKey: ['article-backlinks', visitedArticleTitle],
          queryFn: () => fetchArticleBacklinks(visitedArticleTitle),
          staleTime: 10 * 60 * 1000, // 10 minutes - backlinks don't change often
          gcTime: 30 * 60 * 1000, // 30 minutes
        });

        if (backlinkTitles.length === 0) {
          return null;
        }

        // Filter out visited articles efficiently using Set
        const unvisitedBacklinks = backlinkTitles.filter((title) => !visitedTitlesSet.has(title));
        if (unvisitedBacklinks.length === 0) {
          return null;
        }

        // Pick a random backlink
        const randomIndex = Math.floor(Math.random() * unvisitedBacklinks.length);
        return unvisitedBacklinks[randomIndex];
      } catch (error) {
        return null;
      }
    },
    [queryClient]
  );

  // Get a random forward link from a visited article
  // Uses React Query for caching
  const getRandomForwardlink = useCallback(
    async (visitedArticleTitle: string, visitedTitlesSet: Set<string>) => {
      try {
        // Use React Query to fetch and cache forward links
        const forwardLinkTitles = await queryClient.fetchQuery({
          queryKey: ['article-links', visitedArticleTitle],
          queryFn: () => fetchArticleLinks(visitedArticleTitle),
          staleTime: 10 * 60 * 1000, // 10 minutes - links don't change often
          gcTime: 30 * 60 * 1000, // 30 minutes
        });

        if (forwardLinkTitles.length === 0) {
          return null;
        }

        // Filter out visited articles efficiently using Set
        const unvisitedForwardLinks = forwardLinkTitles.filter((title) => !visitedTitlesSet.has(title));
        if (unvisitedForwardLinks.length === 0) {
          return null;
        }

        // Pick a random forward link
        const randomIndex = Math.floor(Math.random() * unvisitedForwardLinks.length);
        return unvisitedForwardLinks[randomIndex];
      } catch (error) {
        return null;
      }
    },
    [queryClient]
  );

  // Main recommendation function using backlinks OR forward links (not both)
  const getRecommendations = useCallback(
    async (limit = 10) => {
      setLoading(true);
      setError(null);

      try {
        if (visitedArticles.length === 0) {
          return [];
        }

        const processedTitles = new Set<string>();
        const visitedTitlesSet = new Set(visitedArticles.map((v) => v.title));

        // Step 1: Collect candidate titles in parallel (backlinks OR forward links, not both)
        const candidateTitles: string[] = [];
        const maxSourceArticles = Math.min(visitedArticles.length, Math.ceil(limit / 2)); // Use multiple source articles

        // Efficiently select random source articles without sorting (O(n) instead of O(n log n))
        // Fisher-Yates shuffle would be better, but for small arrays this is acceptable
        const sourceArticles: typeof visitedArticles = [];
        const availableIndices = new Set(Array.from({ length: visitedArticles.length }, (_, i) => i));
        
        for (let i = 0; i < maxSourceArticles && availableIndices.size > 0; i++) {
          const randomIndex = Math.floor(Math.random() * availableIndices.size);
          const selectedIndex = Array.from(availableIndices)[randomIndex];
          availableIndices.delete(selectedIndex);
          sourceArticles.push(visitedArticles[selectedIndex]);
        }

        // Fetch all link lists in parallel
        const linkPromises = sourceArticles.map(async (article) => {
          // Randomly choose backlinks OR forward links (50/50)
          const useBacklinks = Math.random() > 0.5;

          try {
            if (useBacklinks) {
              const backlinks = await queryClient.fetchQuery({
                queryKey: ['article-backlinks', article.title],
                queryFn: () => fetchArticleBacklinks(article.title),
                staleTime: 10 * 60 * 1000,
                gcTime: 30 * 60 * 1000,
              });
              return backlinks;
            } else {
              const forwardLinks = await queryClient.fetchQuery({
                queryKey: ['article-links', article.title],
                queryFn: () => fetchArticleLinks(article.title),
                staleTime: 10 * 60 * 1000,
                gcTime: 30 * 60 * 1000,
              });
              return forwardLinks;
            }
          } catch (error) {
            return [];
          }
        });

        const linkResults = await Promise.all(linkPromises);

        // Flatten and filter candidate titles in a single pass (more efficient)
        const allCandidates: string[] = [];
        for (const linkList of linkResults) {
          for (const title of linkList) {
            if (!visitedTitlesSet.has(title) && !processedTitles.has(title)) {
            processedTitles.add(title);
              allCandidates.push(title);
            }
          }
        }

        // Efficiently shuffle using Fisher-Yates algorithm (O(n) instead of O(n log n))
        // Shuffle in-place to avoid creating new arrays
        for (let i = allCandidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allCandidates[i], allCandidates[j]] = [allCandidates[j], allCandidates[i]];
        }

        // Select candidates up to limit (already unique due to Set check above)
        candidateTitles.push(...allCandidates.slice(0, limit));

        // Step 2: Fetch summaries with early termination for better performance
        // Only fetch summaries for the exact number we need (limit), not all candidates
        const recommendations: RecommendationItem[] = [];
        const summaryPromises: Promise<RecommendationItem | null>[] = [];

        // Fetch summaries in batches to allow early termination
        // Request a few extra to account for potential failures
        const fetchLimit = Math.min(candidateTitles.length, limit + 5);
        
        for (let i = 0; i < fetchLimit && recommendations.length < limit; i++) {
          const title = candidateTitles[i];
          const promise = (async () => {
          try {
            const summaryResponse = await queryClient.fetchQuery({
              queryKey: ['article', title],
              queryFn: async () => {
                const response = await fetchArticleSummary(title);
                return response.article;
              },
              staleTime: 5 * 60 * 1000,
              gcTime: 30 * 60 * 1000,
            });

            if (summaryResponse) {
              return {
                title: summaryResponse.title,
                displaytitle: summaryResponse.displaytitle,
                description: summaryResponse.description,
                extract: summaryResponse.extract,
                thumbnail: summaryResponse.thumbnail,
                pageid: summaryResponse.pageid,
              } as RecommendationItem;
            }
            return null;
          } catch (error) {
            // Return basic recommendation if summary fetch fails
            return {
              title,
              displaytitle: title,
            } as RecommendationItem;
          }
          })();

          summaryPromises.push(promise);
        }

        // Wait for all promises and collect valid recommendations
        const results = await Promise.all(summaryPromises);
        for (const result of results) {
          if (result && recommendations.length < limit) {
            recommendations.push(result);
          }
        }

        return recommendations;
      } catch (error) {
        setError('Failed to fetch recommendations');
        return [];
      } finally {
        setLoading(false);
      }
    },
    [visitedArticles, queryClient]
  );

  return {
    getRecommendations,
    visitedArticlesCount: visitedArticles.length,
    loading,
    error,
  };
}
