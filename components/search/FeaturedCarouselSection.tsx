import { useFeaturedContent } from '@/context/FeaturedContentContext';
import React, { useState } from 'react';
import { RecommendationItem } from '../../types/components';
import { CardType } from '../../utils/cardUtils';
import FeaturedCarousel from '../featured/FeaturedCarousel';
import CarouselItemsBottomSheet from './CarouselItemsBottomSheet';
import ContentSection from './ContentSection';
import { FeaturedCarouselSkeleton } from './SkeletonComponents';

interface FeaturedCarouselSectionProps {
  title: string;
  items: RecommendationItem[] | null | undefined;
  cardType?: CardType;
  year?: number;
}

/**
 * Reusable carousel section component for SearchScreen
 * Per MD3 accessibility: includes arrow icon button and modal to view all items
 */
export default function FeaturedCarouselSection({
  title,
  items,
  cardType = 'generic',
  year,
}: FeaturedCarouselSectionProps) {
  const { isLoading } = useFeaturedContent();
  const [modalVisible, setModalVisible] = useState(false);

  const handleHeaderPress = () => {
    // Always try to open modal - it will handle empty items gracefully
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <>
      <ContentSection
        title={title}
        isLoading={isLoading}
        skeleton={<FeaturedCarouselSkeleton />}
        hasCarousel={true}
        onHeaderPress={handleHeaderPress}
      >
        {items && items.length > 0 ? <FeaturedCarousel items={items} cardType={cardType} /> : null}
      </ContentSection>
      <CarouselItemsBottomSheet
        visible={modalVisible}
        onDismiss={handleCloseModal}
        title={title}
        items={items?.filter((item) => item != null) || []}
        cardType={cardType}
      />
    </>
  );
}
