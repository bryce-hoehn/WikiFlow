import { selectAll } from "css-select";
import { removeElement } from "domutils";
import { Image } from "expo-image";
import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text, useTheme } from "react-native-paper";
import type { TNode } from 'react-native-render-html';

// Custom caption renderer for table captions
export const CaptionRenderer = ({ tnode }: { tnode: TNode }) => {
  const theme = useTheme();
  
  const textContent = tnode.children
    ?.map((child: TNode) => {
      // Extract text content from text nodes
      if (child.type === 'text' && 'data' in child) {
        return (child as any).data || '';
      }
      return '';
    })
    .join('')
    .trim();

  if (!textContent) {
    return null;
  }

  return (
    <Text
      selectable
      style={{
        textAlign: 'center',
        padding: 8,
        fontStyle: 'italic',
        color: theme.colors.onSurfaceVariant,
        fontSize: 14,
        lineHeight: 18,
      }}
    >
      {textContent}
    </Text>
  );
};

// Custom image renderer using Expo Image with comprehensive URL resolution
export const ImageRenderer = ({
  tnode,
  style,
  onImagePress
}: {
  tnode: TNode;
  style: React.CSSProperties;
  onImagePress: (image: { uri: string; alt?: string }) => void
}) => {
  const src = tnode.attributes?.src;
  const alt = tnode.attributes?.alt || '';

  const resolveImageUrl = (src: string) => {
    let imageUrl = src;

    // Fix protocol-relative URLs (//upload.wikimedia.org/...)
    if (imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl;
    }
    
    // Fix relative Wikipedia image URLs (/wiki/File:...)
    if (imageUrl.startsWith('/')) {
      imageUrl = 'https://en.wikipedia.org' + imageUrl;
    }
    
    // Fix relative paths without leading slash (./File:...)
    if (imageUrl.startsWith('./')) {
      imageUrl = 'https://en.wikipedia.org/wiki' + imageUrl.slice(1);
    }

    // Handle Wikipedia file URLs - convert to direct image URL
    if (imageUrl.includes('/wiki/File:') || imageUrl.includes('/wiki/Image:')) {
      // Convert Wikipedia file page URL to direct image URL
      const fileName = imageUrl.includes('/wiki/File:') ? imageUrl.split('/wiki/File:')[1] : imageUrl.split('/wiki/Image:')[1];
      if (fileName) {
        const cleanFileName = fileName.split('#')[0].split('?')[0];
        // Use Wikimedia Commons direct URL
        imageUrl = `https://upload.wikimedia.org/wikipedia/commons/${cleanFileName}`;
      }
    }

    // Handle thumbnails and scaled images
    if (imageUrl.includes('/thumb/')) {
      // Remove /thumb/ part to get original image
      imageUrl = imageUrl.replace('/thumb/', '/');
      const parts = imageUrl.split('/');
      // Remove thumbnail filename
      imageUrl = parts.slice(0, -1).join('/');
    }

    return imageUrl;
  };

  const imageUrl = resolveImageUrl(src || "");

  const handleImagePress = () => {
    onImagePress({ uri: imageUrl, alt });
  };

  return (
    <View style={{ width: '100%', marginVertical: 8 }}>
      <TouchableOpacity
        onPress={handleImagePress}
        activeOpacity={0.7}
        accessibilityLabel={`View image: ${alt || 'Article image'}`}
        accessibilityHint="Opens image in full screen view"
        accessibilityRole="button"
      >
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: '100%',
            height: undefined,
            aspectRatio: (Number(tnode.attributes?.width) || 1) / (Number(tnode.attributes?.height) || 1) || 1.5
          }}
          contentFit="contain"
          alt={alt}
          accessibilityLabel={alt || 'Article image'}
          accessibilityHint="Article image, tap to view full screen"
        />
      </TouchableOpacity>
    </View>
  );
};

/**
 * DOM processing function - synchronous version without worklets
 */
const processDom = (element: any) => {
  if (!element || !element.children || element.children.length === 0) {
    return;
  }

  try {
    // Define selectors for elements to remove
    const selectorsToRemove = [
      '.mw-editsection',     // Edit section links
      '.hatnote',            // Hatnotes (disambiguation links)
      '.navbox',             // Navigation boxes
      '.catlinks',           // Category links at bottom
      '.printfooter',        // Print footer
      '.portal',             // Portal boxes
      '.portal-bar',
      '.sister-bar',
      '.sistersitebox',       // Sister site boxes
      '.sidebar',
      '.shortdescription',
      '.nomobile',
      '.mw-empty-elt',
      '.mw-valign-text-top',
      '.plainlinks',
      'style'
    ];

    // Process all selectors synchronously but in small batches to avoid long loops
    for (const selector of selectorsToRemove) {
      const elements = selectAll(selector, element);
      
      for (const el of elements) {
        try {
          if (el.parentNode) {
            removeElement(el);
          }
        } catch {
          // Continue with next element
        }
      }
    }

 } catch {
   // Silently fail to avoid blocking the UI
 }
};

/**
 * Hook for creating DOM visitors - synchronous version
 */
export const useDomVisitors = () => {
  const [visitors, setVisitors] = useState<any>(null);

  useEffect(() => {
    const cleanCss = (element: any) => {
      // Lightweight DOM cleanup; avoid logging in production
      processDom(element);
    };
 
    setVisitors({
      onElement: cleanCss,
    });
  }, []);

  return visitors;
};