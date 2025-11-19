import { LAYOUT } from '@/constants/layout';
import { getHoverStyles } from '@/constants/motion';
import { SPACING } from '@/constants/spacing';
import { useFeaturedContent } from '@/context/FeaturedContentContext';
import { useReducedMotion } from '@/hooks';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Platform, useWindowDimensions, View } from 'react-native';
import { Card, Text, TouchableRipple, useTheme } from 'react-native-paper';
import ImageDialog from '../article/ImageDialog';
import HtmlRenderer from '../common/HtmlRenderer';

export default function FeaturedImageCard() {
  const { featuredContent } = useFeaturedContent();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const img = featuredContent?.image;
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { reducedMotion } = useReducedMotion();

  if (!img) {
    return null;
  }

  // Determine if we're on a small screen (mobile)
  const isSmallScreen = width < LAYOUT.TABLET_BREAKPOINT;

  // Fixed height to match carousel cards (410px)
  const cardHeight = 410;
  const imageHeight = 240;
  const contentHeight = 170;

  // Check if there's any description text content
  const hasDescriptionText = Boolean(
    (img.description?.html && img.description.html.trim().length > 0) ||
    (img.description?.text && img.description.text.trim().length > 0)
  );

  // Web-specific: Hover handlers
  const handleMouseEnter = () => {
    if (Platform.OS === 'web') {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (Platform.OS === 'web') {
      setIsHovered(false);
    }
  };

  return (
    <>
      <Card
        elevation={isHovered && Platform.OS === 'web' ? 4 : 1} // M3: Default elevation 1dp, increases to 4dp on hover
        style={{
          width: '100%',
          height: cardHeight,
          backgroundColor:
            isHovered && Platform.OS === 'web'
              ? theme.colors.surface
              : theme.colors.elevation.level2,
          borderRadius: theme.roundness * 3, // M3: 12dp corner radius (4dp * 3)
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          ...(Platform.OS === 'web' &&
            getHoverStyles(isHovered, reducedMotion, { scale: 1.01 })),
        }}
        {...(Platform.OS === 'web' && {
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
        })}
      >
        {img.image && (
          <TouchableRipple
            onPress={() => setImageModalVisible(true)}
            style={{
              width: '100%',
              height: hasDescriptionText ? imageHeight : cardHeight,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
              }}
            >
              <Image
                source={{ uri: img.image.source }}
                contentFit="cover"
                style={{
                  width: '100%',
                  height: '100%',
                  borderTopLeftRadius: hasDescriptionText ? theme.roundness * 1.25 : theme.roundness * 3,
                  borderTopRightRadius: hasDescriptionText ? theme.roundness * 1.25 : theme.roundness * 3,
                  borderBottomLeftRadius: hasDescriptionText ? 0 : theme.roundness * 3,
                  borderBottomRightRadius: hasDescriptionText ? 0 : theme.roundness * 3,
                }}
                alt={`Thumbnail for ${img.title || 'Featured Picture'}`}
              />
            </View>
          </TouchableRipple>
        )}
        {hasDescriptionText && (
          <Card.Content
            style={{
              backgroundColor: theme.colors.elevation.level2,
              height: contentHeight,
              padding: SPACING.md,
            }}
          >
            {img.description?.html ? (
              <HtmlRenderer
                html={img.description.html}
                maxLines={4}
                style={{ color: theme.colors.onSurface }}
              />
            ) : img.description?.text ? (
              <Text
                variant="bodyMedium"
                numberOfLines={4}
                style={{ color: theme.colors.onSurface }}
              >
                {img.description.text}
              </Text>
            ) : null}
          </Card.Content>
        )}
      </Card>

      <ImageDialog
        visible={imageModalVisible}
        selectedImage={{ uri: img.image.source, alt: img.title || 'Featured Picture' }}
        onClose={() => setImageModalVisible(false)}
      />
    </>
  );
}
