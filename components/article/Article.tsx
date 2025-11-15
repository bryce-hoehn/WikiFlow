import { useArticleHtml } from "@/hooks";
import { router } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';
import ScrollToTopFAB from '../common/ScrollToTopFAB';
import ArticleSectionedRenderer from './ArticleSectionedRenderer';

/* ArticleContent removed — using ArticleSectionedRenderer for article rendering */

interface ArticleProps {
  title?: string;
}

interface ImageModalState {
  visible: boolean;
  selectedImage: { uri: string; alt?: string } | null;
}

export default function Article({ title }: ArticleProps) {
  const theme = useTheme();
  const { data: articleHtml, isLoading, error } = useArticleHtml(title || '');

  // Pre-process HTML to remove <style> tags, which can render as text
  const cleanedArticleHtml = useMemo(() => {
    if (!articleHtml) return '';
    // Regex to remove <style>...</style> blocks globally and case-insensitively
    return articleHtml.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  }, [articleHtml]);
  const scrollViewRef = useRef<ScrollView>(null);
  const [fabVisible, setFabVisible] = useState(false);
  const [fontSize] = useState(16); // Base font size

  const handleLinkPress = useCallback((href: string) => {
    // Handle internal Wikipedia links (both relative and absolute)
    if (href.startsWith('/wiki/') || href.includes('wikipedia.org/wiki/')) {
      let articleTitle = '';
      
      // Extract article title from different URL formats
      if (href.startsWith('/wiki/')) {
        // Relative path: /wiki/Article_Title
        articleTitle = href.replace('/wiki/', '');
      } else if (href.includes('wikipedia.org/wiki/')) {
        // Absolute URL: https://en.wikipedia.org/wiki/Article_Title
        const urlParts = href.split('/wiki/');
        if (urlParts.length > 1) {
          articleTitle = urlParts[1];
        }
      }
      
      // Clean up the title (remove anchors, query parameters)
      articleTitle = articleTitle.split('#')[0].split('?')[0];
      
      if (articleTitle) {
        router.push(`/article/${articleTitle}`);
        return; // Prevent default behavior
      }
    }
    
    // For all other links, open in external browser
    Linking.openURL(href).catch(console.error);
  }, []);

  // Styles handled inside ArticleSectionedRenderer now; removed unused renderConfig

  // // Zoom controls
  // const increaseFontSize = useCallback(() => {
  //   setFontSize(prev => Math.min(prev + 2, 24)); // Max 24px
  // }, []);

  // const decreaseFontSize = useCallback(() => {
  //   setFontSize(prev => Math.max(prev - 2, 12)); // Min 12px
  // }, []);

  // const resetFontSize = useCallback(() => {
  //   setFontSize(16); // Reset to default
  // }, []);





  // Render states
  if (!title) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text selectable variant="bodyMedium">No article title provided</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text selectable style={{ marginTop: 16 }}>Loading article...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text selectable variant="bodyMedium">Error loading article: {error.message}</Text>
      </View>
    );
  }

  if (!articleHtml) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text selectable variant="bodyMedium">No article content available</Text>
      </View>
    );
  }

  return (
    <>
      {/* Zoom Controls */}
      {/* <Appbar.Header style={{ backgroundColor: theme.colors.surface, elevation: 2 }}>
        <Appbar.Action
          icon="minus"
          onPress={decreaseFontSize}
          disabled={fontSize <= 12}
          accessibilityLabel="Decrease font size"
          accessibilityHint="Makes the article text smaller"
        />
        <Appbar.Content
          title={`${Math.round((fontSize / 16) * 100)}%`}
          titleStyle={{ textAlign: 'center', fontSize: 14 }}
        />
        <Appbar.Action
          icon="plus"
          onPress={increaseFontSize}
          disabled={fontSize >= 24}
          accessibilityLabel="Increase font size"
          accessibilityHint="Makes the article text larger"
        />
        <Appbar.Action
          icon="format-size"
          onPress={resetFontSize}
          accessibilityLabel="Reset font size"
          accessibilityHint="Resets the article text to default size"
        />
      </Appbar.Header> */}

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1 }}
        onScroll={(event) => {
          const yOffset = event.nativeEvent.contentOffset.y;
          setFabVisible(yOffset > 300);
        }}
        scrollEventThrottle={16}
        // Enable pinch-to-zoom and text selection
        minimumZoomScale={1.0}
        maximumZoomScale={3.0}
        bouncesZoom={true}
        pinchGestureEnabled={true}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={{ padding: 16 }}>
          <ArticleSectionedRenderer articleHtml={cleanedArticleHtml} baseFontSize={fontSize} />
        </View>
      </ScrollView>
      <ScrollToTopFAB scrollRef={scrollViewRef} visible={fabVisible} />
    </>
  );
}