import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { SPACING } from '../../../constants/spacing';
import { TYPOGRAPHY } from '../../../constants/typography';
import { formatTime } from './utils/timeFormatters';

interface AudioPlayerProps {
  src: string;
  width: number;
  theme: any;
}

/**
 * Audio player component using expo-av
 * Provides custom controls with play/pause, seek, and mute support
 */
export default function AudioPlayer({ src, width, theme }: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const loadSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: src },
        { shouldPlay: false }
      );
      setSound(newSound);
      
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis || 0);
      }

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying);
          setPosition(status.positionMillis || 0);
          setVolume(status.volume || 1.0);
          setIsMuted(status.isMuted || false);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPosition(0);
          }
        }
      });
    } catch (error) {
      if (__DEV__) {
        console.warn('Failed to load audio:', error);
      }
    }
  };

  useEffect(() => {
    loadSound();
  }, [src]);

  const playPause = async () => {
    if (!sound) return;
    
    try {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Failed to play/pause audio:', error);
      }
    }
  };

  const seek = async (positionMillis: number) => {
    if (!sound) return;
    
    try {
      await sound.setPositionAsync(positionMillis);
    } catch (error) {
      if (__DEV__) {
        console.warn('Failed to seek audio:', error);
      }
    }
  };

  const toggleMute = async () => {
    if (!sound) return;
    
    try {
      if (isMuted) {
        await sound.setVolumeAsync(volume || 1.0);
        setIsMuted(false);
      } else {
        await sound.setVolumeAsync(0);
        setIsMuted(true);
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('Failed to toggle mute:', error);
      }
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
          paddingVertical: SPACING.sm,
          paddingHorizontal: SPACING.md,
        }}
      >
        {/* Audio controls - Chrome-like compact single row */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton
            icon={isPlaying ? 'pause' : 'play'}
            size={24}
            iconColor={theme.colors.primary}
            onPress={playPause}
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            style={{ margin: 0 }}
          />
          <View style={{ flex: 1, marginHorizontal: SPACING.sm }}>
            <Slider
              value={position}
              onValueChange={seek}
              minimumValue={0}
              maximumValue={duration || 1}
              minimumTrackTintColor={theme.colors.primary}
              maximumTrackTintColor={theme.colors.outlineVariant}
              thumbTintColor={theme.colors.primary}
              style={{ height: SPACING.xs }}
            />
          </View>
          <Text 
            variant="bodySmall" 
            style={{ 
              color: theme.colors.onSurfaceVariant,
              fontSize: TYPOGRAPHY.bodySmall - 1,
              marginHorizontal: SPACING.xs + 2,
              minWidth: 60,
            }}
          >
            {formatTime(position)} / {formatTime(duration)}
          </Text>
          <IconButton
            icon={isMuted ? 'volume-off' : 'volume-high'}
            size={20}
            iconColor={theme.colors.onSurfaceVariant}
            onPress={toggleMute}
            accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
            style={{ margin: 0 }}
          />
        </View>
      </View>
    </View>
  );
}

