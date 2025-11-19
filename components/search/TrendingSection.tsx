import { useFeaturedContent } from '@/context/FeaturedContentContext';
import React, { useMemo, useState } from 'react';
import { RecommendationItem } from '../../types/components';
import TrendingList from '../featured/Trending';
import CarouselItemsBottomSheet from './CarouselItemsBottomSheet';
import ContentSection from './ContentSection';
import { TrendingCarouselSkeleton } from './SkeletonComponents';

interface TrendingSectionProps {
  maxItemsPerPage?: number;
}

/**
 * Trending Articles section component for SearchScreen
 * Per MD3 accessibility: includes arrow icon button and modal to view all items
 */
export default function TrendingSection({ maxItemsPerPage = 6 }: TrendingSectionProps) {
  const { featuredContent, isLoading } = useFeaturedContent();
  const [modalVisible, setModalVisible] = useState(false);

  // Flatten all trending articles for the modal
  const allTrendingItems = useMemo<RecommendationItem[]>(() => {
    if (!featuredContent?.mostread?.articles) return [];
    return featuredContent.mostread.articles.map((article: any) => ({
      title: article.title,
      description: article.description,
      thumbnail: article.thumbnail?.source
        ? {
            source: article.thumbnail.source,
            width: article.thumbnail.width,
            height: article.thumbnail.height,
          }
        : undefined,
      pageid: article.pageid,
      articleTitle: article.title,
    }));
  }, [featuredContent?.mostread?.articles]);

  const handleHeaderPress = () => {
    if (allTrendingItems.length > 0) {
      setModalVisible(true);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <>
    <ContentSection
      title="Trending Articles"
      isLoading={isLoading}
      skeleton={<TrendingCarouselSkeleton itemsCount={maxItemsPerPage} />}
        hasCarousel={true}
        onHeaderPress={handleHeaderPress}
    >
      {featuredContent?.mostread ? <TrendingList maxItemsPerPage={maxItemsPerPage} /> : null}
    </ContentSection>
      {allTrendingItems.length > 0 && (
        <CarouselItemsBottomSheet
          visible={modalVisible}
          onDismiss={handleCloseModal}
          title="Trending Articles"
          items={allTrendingItems}
          cardType="generic"
        />
      )}
    </>
  );
}
