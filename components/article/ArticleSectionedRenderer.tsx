import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useMemo } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import { useTheme, type MD3Theme } from 'react-native-paper';
import { fetchArticleHtml } from '../../api';
import { LAYOUT } from '../../constants/layout';
import { getArticleClassStyles, getArticleTagStyles } from '../../utils/articleStyles';
import { getOptimizedThumbnailUrl } from '../../utils/imageUtils';
import { followLink, parseLink } from '../../utils/linkHandler';
import ResponsiveImage from '../common/ResponsiveImage';
import { useArticleRenderersConfig } from './ArticleRenderersConfig';
import ArticleSectionRenderer from './ArticleSectionRenderer';
import ArticleSkeleton from './ArticleSkeleton';
import { useArticleSections } from './hooks/useArticleSections';

interface Props {
  articleHtml: string;
  baseFontSize?: number;
  lineHeight?: number;
  paragraphSpacing?: number;
  fontFamily?: string;
  readingPadding?: number;
  onSectionsExtracted?: (sections: { id: string; heading: string }[]) => void;
  scrollToSection?: string | null;
  articleTitle?: string;
  initialExpandedSections?: string[];
  onExpandedSectionsChange?: (expandedSections: string[]) => void;
  onImagePress?: (image: { uri: string; alt?: string }) => void;
}

function ArticleSectionedRenderer({
  articleHtml,
  baseFontSize = 16,
  lineHeight = 1.6,
  paragraphSpacing = 16,
  fontFamily = 'system',
  onSectionsExtracted,
  scrollToSection,
  articleTitle,
  initialExpandedSections,
  onExpandedSectionsChange,
  onImagePress,
  readingPadding = 0,
}: Props) {
  const theme = useTheme();
  const windowDimensions = useWindowDimensions();
  const width = useMemo(() => windowDimensions.width, [windowDimensions.width]);
  const primaryColor = theme.colors.primary;
  const queryClient = useQueryClient();

  const handleLinkPress = useCallback((href?: string) => {
    if (!href || typeof href !== 'string') return;
    followLink(href);
  }, []);

  const handleLinkHover = useCallback(
    (href: string) => {
      if (Platform.OS !== 'web' || !href) return;

      const parsed = parseLink(href);
      if (parsed.kind === 'article' && parsed.id) {
        queryClient.prefetchQuery({
          queryKey: ['article-html', parsed.id],
          queryFn: () => fetchArticleHtml(parsed.id!),
          staleTime: 30 * 60 * 1000,
        });
      }
    },
    [queryClient]
  );

  const { renderers, stableRenderersProps, customHTMLElementModels, domVisitors } =
    useArticleRenderersConfig({
      articleTitle,
      onImagePress,
      handleLinkPress,
      handleLinkHover,
      primaryColor,
    });

  const { parsedContent, isParsing, sections, expandedSections, onAccordionPress } =
    useArticleSections({
      articleHtml,
      initialExpandedSections,
      onSectionsExtracted,
      onExpandedSectionsChange,
      scrollToSection,
      articleTitle,
    });

  const elevationLevel5 = (theme.colors as any).elevation?.level5;
  const stableTheme = useMemo((): MD3Theme => {
    const surfaceContainerHighest =
      elevationLevel5 || (theme.colors as any).surfaceContainerHighest;
    const colors = {
      ...theme.colors,
      surfaceContainerHighest,
    };
    return {
      ...theme,
      colors,
      roundness: theme.roundness,
    } as MD3Theme;
  }, [
    theme.colors.onSurface,
    theme.colors.onSurfaceVariant,
    theme.colors.primary,
    elevationLevel5,
    theme.colors.outlineVariant,
    theme.colors.surfaceVariant,
    theme.roundness,
  ]);

  const tagsStyles = useMemo(
    () => getArticleTagStyles(stableTheme, baseFontSize, lineHeight, paragraphSpacing, fontFamily),
    [stableTheme, baseFontSize, lineHeight, paragraphSpacing, fontFamily]
  );

  const classesStyles = useMemo(
    () => getArticleClassStyles(stableTheme, baseFontSize),
    [stableTheme, baseFontSize]
  );

  const contentWidth = useMemo(() => {
    return width - readingPadding * 2;
  }, [width, readingPadding]);

  const systemFonts = useMemo(() => ['Arial', 'Georgia', 'Courier New'], []);
  const ignoredDomTags = useMemo(() => ['script', 'style', 'map', 'link', 'meta', 'math'], []);
  const defaultTextProps = useMemo(() => ({ selectable: true }), []);

  const isLargeScreen = width >= LAYOUT.DESKTOP_BREAKPOINT;
  const maxImageWidth = isLargeScreen ? Math.min(LAYOUT.ARTICLE_MAX_WIDTH, 900) : '100%';

  const infoboxThumbnailWidth = useMemo(() => {
    if (typeof maxImageWidth === 'number') {
      return Math.min(maxImageWidth, 1200);
    }
    return Math.min(width - 8, 800);
  }, [maxImageWidth, width]);

  const optimizedInfoboxImageUrl = useMemo(() => {
    if (!parsedContent?.infoboxImage?.src) return null;
    const optimized = getOptimizedThumbnailUrl(
      parsedContent.infoboxImage.src,
      infoboxThumbnailWidth
    );
    return optimized && optimized.trim() ? optimized : null;
  }, [parsedContent?.infoboxImage?.src, infoboxThumbnailWidth]);

  const infoboxImageUrl = useMemo(() => {
    if (!parsedContent?.infoboxImage?.src) return null;
    return optimizedInfoboxImageUrl || parsedContent.infoboxImage.src;
  }, [optimizedInfoboxImageUrl, parsedContent?.infoboxImage?.src]);

  if (isParsing || !parsedContent) {
    return <ArticleSkeleton />;
  }

  return (
    <View>
      {parsedContent?.infoboxImage && infoboxImageUrl && (
        <View
          style={{
            marginBottom: 16,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: typeof maxImageWidth === 'number' ? maxImageWidth : '100%',
              maxWidth: typeof maxImageWidth === 'number' ? maxImageWidth : '100%',
            }}
          >
            <ResponsiveImage
              source={{
                source: infoboxImageUrl,
                width: parsedContent.infoboxImage.width,
                height: parsedContent.infoboxImage.height,
              }}
              contentFit="cover"
              alt={parsedContent.infoboxImage.alt}
              onPress={onImagePress}
              isAboveFold={true}
              priority="high"
              skipOptimization={!!optimizedInfoboxImageUrl}
              style={{
                borderRadius: 0,
              }}
            />
          </View>
        </View>
      )}

      <View style={{ paddingHorizontal: 0 }}>
        <View style={{ paddingHorizontal: 0 }}>
          {sections.map((sec) => (
            <ArticleSectionRenderer
              key={sec.id}
              section={sec}
              isExpanded={expandedSections.includes(sec.id)}
              onPress={() => onAccordionPress(sec.id)}
              renderers={renderers}
              renderersProps={stableRenderersProps}
              customHTMLElementModels={customHTMLElementModels}
              domVisitors={domVisitors}
              tagsStyles={tagsStyles}
              classesStyles={classesStyles}
              contentWidth={contentWidth}
              systemFonts={systemFonts}
              ignoredDomTags={ignoredDomTags}
              defaultTextProps={defaultTextProps}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

export default ArticleSectionedRenderer;
