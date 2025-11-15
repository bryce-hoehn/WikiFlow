import { router } from 'expo-router';
import React from 'react';
import { Linking } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { parseHtml } from '../../utils/articleParsing';

interface HtmlRendererProps {
  html: string;
  maxLines?: number;
  variant?: 'bodyLarge' | 'bodyMedium' | 'bodySmall' | 'titleLarge' | 'titleMedium' | 'titleSmall';
  style?: any;
}

/**
 * Simplified HTML renderer that renders all text inline
 *
 * Uses the centralized parseHtml helper so parsing behavior is consistent
 * across the codebase and to avoid direct htmlparser2 imports here.
 */
export default function HtmlRenderer({ html, maxLines, variant = 'bodyLarge', style }: HtmlRendererProps) {
  const theme = useTheme();
  
  // Validate html input
  if (!html || typeof html !== 'string' || html.trim() === '') {
    return null;
  }

  let elements: any[] = [];
  
  try {
    const doc = parseHtml(html);
    elements = (doc && (doc as any).children) || [];
  } catch (parseError) {
    // Avoid noisy logging — fallback to plain text rendering when parse fails
    const plainText = html.replace(/<[^>]*>/g, '').trim();
    if (!plainText) {
      return null;
    }
    return (
      <Text
        variant={variant}
        style={style}
        numberOfLines={maxLines}
      >
        {plainText}
      </Text>
    );
  }

  const handleLinkPress = (href: string) => {
    if (!href || typeof href !== 'string') return;
    if (href.includes('Category:')) {
      const categoryUrl = href.startsWith('./Category:')
        ? href.slice('./Category:'.length)
        : href.slice('https://en.wikipedia.org/wiki/Wikipedia:Contents/Categories#'.length);
      router.push(`/subcategory/${encodeURIComponent(categoryUrl)}`);
    } else if (href.startsWith('./') || href.includes('wikipedia.org/wiki/')) {
      const articleUrl = href.startsWith('./')
        ? href.slice('./'.length)
        : href.slice('https://en.wikipedia.org/wiki/'.length);
      router.push(`/article/${encodeURIComponent(articleUrl)}`);
    } else {
      Linking.openURL(href).catch(() => {});
    }
  };

  // Recursive node renderer that returns inline <Text> elements
  const renderNode = (node: any, key: string): React.ReactNode => {
    if (node.type === 'text') {
      return node.data;
    }

    if (node.type === 'tag') {
      const children = node.children?.map((child: any, index: number) =>
        renderNode(child, `${key}-${index}`)
      ) || [];

      switch (node.name) {
        case 'br':
          return '\n';
        case 'strong':
        case 'b':
          return <Text key={key} style={{ fontWeight: 'bold' }}>{children}</Text>;
        case 'em':
        case 'i':
          return <Text key={key} style={{ fontStyle: 'italic' }}>{children}</Text>;
        case 'a': {
          const href = node.attribs?.href;
          return (
            <Text
              key={key}
              style={{ color: theme.colors.primary }}
              onPress={() => handleLinkPress(href)}
            >
              {children}
            </Text>
          );
        }
        case 'style':
          return null;
        case 'span':
          if (node.attribs?.class === 'wikipedia-link' || node.attribs?.class === 'mw-page-title-main') {
            let articleTitle = '';
            if (node.children?.[0]?.type === 'text') {
              articleTitle = node.children[0].data;
            }
            return (
              <Text
                key={key}
                style={{ color: theme.colors.primary }}
                onPress={() => {
                  if (articleTitle) {
                    router.push(`/article/${encodeURIComponent(articleTitle)}`);
                  }
                }}
              >
                {children}
              </Text>
            );
          }
          return children;
        default:
          return children;
      }
    }

    return null;
  };

  const content = elements.map((node, index) => renderNode(node, `node-${index}`));

  // Wrap all in a single Text so they stay inline
  return (
    <Text
      variant={variant}
      style={style}
      numberOfLines={maxLines}
    >
      {content}
    </Text>
  );
}
