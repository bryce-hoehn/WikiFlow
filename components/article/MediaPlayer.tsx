import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import { useTheme } from 'react-native-paper';
import type { TNode } from 'react-native-render-html';
import { LAYOUT } from '../../constants/layout';
import { SPACING } from '../../constants/spacing';
import AudioPlayer from './media/AudioPlayer';
import { resolveMediaRedirect, resolveMediaUrl, type ResolvedMediaUrl } from './media/utils/mediaUtils';
import VideoPlayer from './media/VideoPlayer';

interface MediaPlayerProps {
  tnode: TNode;
  type: 'video' | 'audio';
}

/**
 * Media player component using expo-video and expo-av for native platforms and HTML5 video/audio for web
 * Handles both video and audio elements from Wikipedia articles
 */
export default function MediaPlayer({ tnode, type }: MediaPlayerProps) {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const attrs = (tnode as any)?.attributes || {};

  // Get media source from various possible attributes
  // Wikipedia often uses 'resource' attribute for media files, or data-file-url, data-file, or href in parent <a> tags
  let rawSrc =
    attrs.resource ||
    attrs.src ||
    attrs['data-src'] ||
    attrs['data-file-url'] ||
    attrs['data-file'] ||
    attrs.source ||
    attrs.href ||
    '';
  const rawPoster = attrs.poster || attrs['data-poster'] || '';

  // Check for <source> tags inside the audio/video element (common in HTML5)
  if (!rawSrc && (tnode as any)?.children) {
    try {
      const children = (tnode as any).children || [];
      for (const child of children) {
        if (child.type === 'tag' && (child.name === 'source' || child.name === 'track')) {
          const childAttrs = child.attributes || {};
          const childSrc = childAttrs.src || childAttrs['data-src'] || '';
          if (childSrc) {
            rawSrc = childSrc;
            break;
          }
        }
      }
    } catch (e) {
      // Ignore errors accessing children
    }
  }

  // Also check parent node for href (Wikipedia often wraps media in <a> tags)
  let parentHref = '';
  try {
    let parent: TNode | null | undefined = (tnode as TNode & { parent?: TNode | null })?.parent;
    while (parent && !parentHref) {
      if (parent.attributes?.href) {
        parentHref = parent.attributes.href;
        break;
      }
      parent = (parent as TNode & { parent?: TNode | null })?.parent ?? null;
    }
  } catch (e) {
    // Ignore errors accessing parent
  }

  // Use parent href if no direct src found
  const finalRawSrc = rawSrc || parentHref;

  const resolvedSrc: ResolvedMediaUrl = resolveMediaUrl(finalRawSrc);
  const resolvedPoster: ResolvedMediaUrl = resolveMediaUrl(rawPoster);

  // Resolve filenames to direct URLs via API (needed for media playback)
  const { data: src } = useQuery({
    queryKey: ['resolveMediaRedirect', resolvedSrc],
    queryFn: () => resolveMediaRedirect(resolvedSrc),
    enabled: !!resolvedSrc && resolvedSrc.type === 'filename',
    staleTime: Infinity, // Cache forever since file URLs don't change
    gcTime: Infinity,
  });

  const { data: poster } = useQuery({
    queryKey: ['resolveMediaRedirect', resolvedPoster],
    queryFn: () => resolveMediaRedirect(resolvedPoster),
    enabled: !!resolvedPoster && resolvedPoster.type === 'filename',
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Use resolved URLs or fall back to direct URLs
  const finalSrc = src || (resolvedSrc?.type === 'url' ? resolvedSrc.value : '');
  const finalPoster = poster || (resolvedPoster?.type === 'url' ? resolvedPoster.value : '');

  // Calculate max width for large screens
  const isLargeScreen = windowWidth >= LAYOUT.DESKTOP_BREAKPOINT;
  const maxWidth = isLargeScreen ? Math.min(LAYOUT.ARTICLE_MAX_WIDTH, 900) : windowWidth - 32;
  const playerWidth = typeof maxWidth === 'number' ? maxWidth : windowWidth - 32;

  // Determine aspect ratio (default 16:9 for video, auto for audio)
  const aspectRatio =
    type === 'video'
      ? attrs.width && attrs.height
        ? Number(attrs.width) / Number(attrs.height)
        : 16 / 9
      : undefined;

  const height =
    type === 'video' && aspectRatio ? playerWidth / aspectRatio : type === 'audio' ? 60 : 300;

  // Early return if no source
  if (!finalSrc) {
    return null;
  }

  // For native platforms, use expo-video and expo-av
  if (Platform.OS !== 'web') {
    if (type === 'video') {
      return <VideoPlayer src={finalSrc} poster={finalPoster} width={playerWidth} height={height} theme={theme} />;
    } else {
      return <AudioPlayer src={finalSrc} width={playerWidth} theme={theme} />;
    }
  }

  // For web, use native HTML5 elements
  return (
    <View
      style={{
        width: '100%',
        marginVertical: SPACING.base,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: playerWidth,
          maxWidth: '100%',
          borderRadius: theme.roundness * 2,
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceVariant,
        }}
      >
        {type === 'video' ? (
          <video
            controls
            poster={finalPoster || undefined}
            style={{
              width: '100%',
              height: 'auto',
              maxWidth: '100%',
            }}
            preload="metadata"
            crossOrigin="anonymous"
          >
            <source src={finalSrc} type="video/mp4" />
            <source src={finalSrc} type="video/webm" />
            <source src={finalSrc} type="video/ogg" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <audio
            controls
            style={{
              width: '100%',
            }}
            preload="metadata"
            crossOrigin="anonymous"
          >
            <source src={finalSrc} type="audio/mpeg" />
            <source src={finalSrc} type="audio/mp3" />
            <source src={finalSrc} type="audio/ogg" />
            <source src={finalSrc} type="audio/wav" />
            <source src={finalSrc} type="audio/webm" />
            Your browser does not support the audio tag.
          </audio>
        )}
      </View>
    </View>
  );
}
