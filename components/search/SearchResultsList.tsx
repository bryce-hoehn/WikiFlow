import React from 'react';
import { SearchSuggestion } from '../../types';
import BaseListWithHeader from './BaseListWithHeader';

interface SearchResultsListProps {
  suggestions: SearchSuggestion[];
  onSuggestionClick: (title: string) => void;
  query?: string;
}

export default function SearchResultsList({
  suggestions,
  onSuggestionClick,
  query = '',
}: SearchResultsListProps) {
  const headerTitle = query ? `Search for '${query}'` : 'Search Results';
  
  return (
    <BaseListWithHeader
      data={suggestions}
      headerTitle={headerTitle}
      getTitle={(item) => item.title}
      getDescription={(item) => item.description || ''}
      getThumbnail={(item) => item.image || null}
      getThumbnailDimensions={() => ({ width: 56, height: 56 })}
      fallbackIcon="file-document-outline"
      onItemPress={(item) => onSuggestionClick(item.title)}
      keyExtractor={(item) => `suggestion-${item.title}`}
      accessibilityLabel={(item) => `Open article: ${item.title}`}
      accessibilityHint={(item) => `Opens the ${item.title} article`}
    />
  );
}
