import Slider from '@react-native-community/slider';
import { VideoView, useVideoPlayer } from 'expo-video';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { SPACING } from '../../../constants/spacing';
import { TYPOGRAPHY } from '../../../constants/typography';
import { hexToRgba } from './utils/themeUtils';
import { formatTimeFromSeconds } from './utils/timeFormatters';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  width: number;
  height: number;
  theme: any;
}

/**
 * Video player component using expo-video
 * Provides custom controls with play/pause, seek, mute, and fullscreen support
 */
export default function VideoPlayer({ src, poster, width, height, theme }: VideoPlayerProps) {
  const videoRef = useRef<VideoView>(null);
  const isMountedRef = useRef(true);
  const player = useVideoPlayer(src, (player) => {
    if (player && isMountedRef.current) {
      player.loop = false;
      player.muted = false;
    }
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Pause and release player on unmount
      if (player) {
        try {
          player.pause();
        } catch (error) {
          // Player may already be released, ignore error
          if (__DEV__) {
            console.warn('Error pausing player on unmount:', error);
          }
        }
      }
    };
  }, [player]);

  useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      if (player && isMountedRef.current) {
        try {
          setIsPlaying(player.playing);
          setCurrentTime(player.currentTime);
          setDuration(player.duration);
        } catch (error) {
          // Player may have been released, clear interval
          if (__DEV__) {
            console.warn('Error accessing player properties:', error);
          }
          clearInterval(interval);
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [player]);

  const togglePlayPause = () => {
    if (player && isMountedRef.current) {
      try {
        if (player.playing) {
          player.pause();
        } else {
          player.play();
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('Error toggling play/pause:', error);
        }
      }
    }
  };

  const seekTo = (time: number) => {
    if (player && isMountedRef.current) {
      try {
        player.currentTime = time;
      } catch (error) {
        if (__DEV__) {
          console.warn('Error seeking:', error);
        }
      }
    }
  };

  const toggleMute = () => {
    if (player && isMountedRef.current) {
      try {
        player.muted = !player.muted;
      } catch (error) {
        if (__DEV__) {
          console.warn('Error toggling mute:', error);
        }
      }
    }
  };

  const enterFullscreen = () => {
    if (videoRef.current && Platform.OS !== 'web') {
      videoRef.current.enterFullscreen();
    }
  };

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
          width: width,
          maxWidth: '100%',
          borderRadius: theme.roundness * 2,
          overflow: 'hidden',
          backgroundColor: theme.colors.surfaceVariant,
          height: height,
        }}
      >
        {player && (
          <VideoView
            ref={videoRef}
            player={player}
            style={{
              width: '100%',
              height: '100%',
            }}
            contentFit="contain"
            nativeControls={false}
            allowsFullscreen={true}
          />
        )}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: hexToRgba(theme.colors.scrim, 0.85),
            paddingVertical: SPACING.xs + 2,
            paddingHorizontal: SPACING.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconButton
              icon={isPlaying ? 'pause' : 'play'}
              size={20}
              iconColor="#FFFFFF"
              onPress={togglePlayPause}
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              style={{ margin: 0 }}
            />
            <View style={{ flex: 1, marginHorizontal: SPACING.sm }}>
              <Slider
                value={currentTime}
                onValueChange={seekTo}
                minimumValue={0}
                maximumValue={duration || 1}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={hexToRgba('#FFFFFF', 0.3)}
                thumbTintColor={theme.colors.primary}
                style={{ height: SPACING.xs }}
              />
            </View>
            <Text style={{ color: '#FFFFFF', fontSize: TYPOGRAPHY.bodySmall - 1, marginHorizontal: SPACING.xs + 2, minWidth: 70 }}>
              {formatTimeFromSeconds(currentTime)} / {formatTimeFromSeconds(duration)}
            </Text>
            <IconButton
              icon={player?.muted ? 'volume-off' : 'volume-high'}
              size={20}
              iconColor="#FFFFFF"
              onPress={toggleMute}
              accessibilityLabel={player?.muted ? 'Unmute' : 'Mute'}
              style={{ margin: 0 }}
            />
            {Platform.OS !== 'web' && (
              <IconButton
                icon="fullscreen"
                size={20}
                iconColor="#FFFFFF"
                onPress={enterFullscreen}
                accessibilityLabel="Fullscreen"
                style={{ margin: 0 }}
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

