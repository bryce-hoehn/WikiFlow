import FeaturedArticleSection from '@/components/search/FeaturedArticleSection';
import FeaturedCarouselSection from '@/components/search/FeaturedCarouselSection';
import FeaturedContentError from '@/components/search/FeaturedContentError';
import FeaturedPictureSection from '@/components/search/FeaturedPictureSection';
import SearchOverlay from '@/components/search/SearchOverlay';
import TrendingSection from '@/components/search/TrendingSection';
import { useFeaturedContent } from '@/context/FeaturedContentContext';
import { FlashList } from '@shopify/flash-list';
import React, { useState } from 'react';
import { View } from 'react-native';
import { Appbar, Searchbar, useTheme } from 'react-native-paper';

export default function SearchScreen() {
  const theme = useTheme();
  const { featuredContent, isLoading, error } = useFeaturedContent();
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);

  const handleSearchOpen = () => {
    setShowSearchOverlay(true);
  };

  const handleSearchClose = () => {
    setShowSearchOverlay(false);
  };

  const contentItems = [
    {
      key: 'featured-article',
      content: <FeaturedArticleSection />
    },
    {
      key: 'in-the-news',
      content: (
        <FeaturedCarouselSection
          title="In The News"
          items={featuredContent?.news?.map((newsItem, index) => {
            // Use the first link for navigation and thumbnail
            const firstLink = newsItem.links[0];
            return {
              title: firstLink?.title || 'News Story',
              description: newsItem.story || firstLink?.description || firstLink?.title || 'Latest news',
              thumbnail: firstLink?.thumbnail,
              pageid: firstLink?.pageid,
              // Add the full article title for navigation
              articleTitle: firstLink?.title,
              // Add links array for the carousel item to handle multiple articles
              links: newsItem.links,
            };
          })}
          cardType="news"
        />
      )
    },
    {
      key: 'did-you-know',
      content: (
        <FeaturedCarouselSection
          title="Did You Know?"
          items={featuredContent?.dyk?.map(item => {
            const titleMatch = item.html.match(/title="([^"]*)"/);
            const title = titleMatch?.[1] || 'Did You Know?';
            
            return {
              title,
              description: item.html, // Keep HTML for proper rendering
              html: item.html, // Add explicit html field for Did You Know items
            };
          })}
          cardType="did-you-know"
        />
      )
    },
    {
      key: 'featured-picture',
      content: <FeaturedPictureSection />
    },
    {
      key: 'trending',
      content: <TrendingSection />
    },
    {
      key: 'on-this-day',
      content: (
        <FeaturedCarouselSection
          title="On This Day"
          items={featuredContent?.onthisday?.map(item => ({
            title: item.text.substring(0, 100) + '...',
            description: item.text,
            html: item.text, // Add HTML field for proper rendering with links
            thumbnail: item.pages?.[0]?.thumbnail,
            year: item.year, // Add the year from the OnThisDayItem
            page: item.pages?.[0],
            articleTitle: item.pages?.[0]?.title,
          }))}
          cardType="on-this-day"
        />
      )
    }
  ].filter(item => {
    // Filter out sections that don't have content (except during loading)
    if (isLoading) return true;
    
    // Check if the section has actual content
    switch (item.key) {
      case 'featured-article':
        return !!featuredContent?.tfa;
      case 'in-the-news':
        return !!featuredContent?.news?.length;
      case 'did-you-know':
        return !!featuredContent?.dyk?.length;
      case 'featured-picture':
        return !!featuredContent?.image;
      case 'trending':
        return !!featuredContent?.mostread;
      case 'on-this-day':
        return !!featuredContent?.onthisday?.length;
      default:
        return false;
    }
  });

  // Show error state if there's an error and no content
  if (error && !featuredContent && !isLoading) {
    return (
      <>
        <SearchOverlay
          visible={showSearchOverlay}
          onClose={handleSearchClose}
        />
        
        {!showSearchOverlay && (
          <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Appbar.Header
              style={{
                backgroundColor: theme.colors.surface,
              }}
            >
              <Searchbar
                placeholder="Search Wikipedia"
                value=""
                onFocus={handleSearchOpen}
                style={{
                  flex: 1,
                  marginHorizontal: 16,
                }}
              />
            </Appbar.Header>
            
            <FeaturedContentError />
          </View>
        )}
      </>
    );
  }

  return (
    <>
      <SearchOverlay
        visible={showSearchOverlay}
        onClose={handleSearchClose}
      />
      
      {!showSearchOverlay && (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <Appbar.Header
            style={{
              backgroundColor: theme.colors.surface,
            }}
          >
            <Searchbar
              placeholder="Search Wikipedia"
              value=""
              onFocus={handleSearchOpen}
              style={{
                flex: 1,
                marginHorizontal: 16,
              }}
            />
          </Appbar.Header>
          
          <FlashList
            data={contentItems}
            renderItem={({ item }) => item.content}
            keyExtractor={(item) => item.key}
            style={{ backgroundColor: theme.colors.background }}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: 16,
              paddingHorizontal: 16,
              flexGrow: 1,
              gap: 16,
            }}
          />
        </View>
      )}
    </>
  );
}
