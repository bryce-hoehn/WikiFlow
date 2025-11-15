import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import React from 'react';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { BookmarksProvider } from '../context/BookmarksContext';
import { FeaturedContentProvider } from '../context/FeaturedContentContext';
import { ThemeProvider } from '../context/ThemeProvider';

// Silence development-only logs in production builds (aggressive sweep).
// Keeps console.error for runtime errors, removes console.log/warn/debug noise.
if (typeof __DEV__ !== 'undefined' && !__DEV__) {
  console.log = () => {};
  console.warn = () => {};
  console.debug = () => {};
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function Layout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BookmarksProvider>
            <FeaturedContentProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
              </Stack>
            </FeaturedContentProvider>
          </BookmarksProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

