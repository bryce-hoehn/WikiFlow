import { fetchArticleThumbnail } from '@/api/articles/fetchArticleThumbnail';
import { SearchOverlay } from '@/components';
import Article from '@/components/article/Article';
import ArticleHeader from '@/components/article/ArticleHeader';
import ArticleImageModal from '@/components/article/ArticleImageModal';
import { useArticle, useBookmarks, useVisitedArticles } from '@/hooks';
import { ImageThumbnail } from '@/types';
import { shareArticle } from '@/utils/shareUtils';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from 'react-native-paper';

export default function ArticleScreen() {
  const theme = useTheme();
  const { title } = useLocalSearchParams<{ title: string }>();
  const [showSearch, setShowSearch] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{uri: string; alt?: string} | null>(null);
  const [thumbnail, setThumbnail] = useState<ImageThumbnail>();
  const hasTrackedVisit = useRef(false);
  const { data: article } = useArticle(title as string);
  const { addVisitedArticle } = useVisitedArticles();
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();

  // Fetch thumbnail when title changes - defer to avoid blocking navigation
  useEffect(() => {
    const fetchThumbnail = async () => {
      if (title) {
        // Use setTimeout to yield to the UI thread for navigation
        setTimeout(async () => {
          const thumbnail = await fetchArticleThumbnail(title as string);
          setThumbnail(thumbnail as unknown as ImageThumbnail);
        }, 100);
      }
    };

    fetchThumbnail();
  }, [title]);

  // Track article visit when article data is loaded (only once per article) - defer to avoid blocking
  useEffect(() => {
    if (article && title && !hasTrackedVisit.current) {
      // Use setTimeout to yield to the UI thread for navigation
      setTimeout(() => {
        addVisitedArticle(title as string, article);
        hasTrackedVisit.current = true;
      }, 200);
    }
  }, [article, title, addVisitedArticle]);

  // Reset tracking when title changes
  useEffect(() => {
    hasTrackedVisit.current = false;
  }, [title]);
  
  const handleBackPress = () => {
    router.back();
  };

  const handleSearchPress = () => {
    setShowSearch(true);
  };

  const handleSearchClose = () => {
    setShowSearch(false);
  };

  const handleBookmarkToggle = async () => {
    if (!article) return;
    
    const bookmarked = isBookmarked(article.title);
    if (bookmarked) {
      await removeBookmark(article.title);
    } else {
      await addBookmark(article.title, thumbnail, article.description);
    }
  };

  const handleShare = async () => {
    if (!article) return;
    
    try {
      await shareArticle(
        article.title,
        article.description,
        article.content_urls?.mobile.page
      );
    } catch (error) {
      console.error('Failed to share article:', error);
    }
  };


  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
  };

  return (
    <>
      {showSearch ? (
        <SearchOverlay visible={showSearch} onClose={handleSearchClose} />
      ) : (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View style={{ flex: 1 }}>
            <ArticleHeader
              title={article?.title}
              isBookmarked={isBookmarked}
              onBookmarkToggle={handleBookmarkToggle}
              onSearchPress={handleSearchPress}
              onBackPress={handleBackPress}
              onShare={handleShare}
            />
            <Article title={title as string} />
          </View>
        </View>
      )}
      
      <ArticleImageModal
        visible={showImageModal}
        selectedImage={selectedImage}
        onClose={handleCloseImageModal}
      />
    </>
  );
}
