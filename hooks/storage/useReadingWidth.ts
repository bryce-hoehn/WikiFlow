import { useCallback, useMemo } from 'react';
import useAsyncStorage from './useAsyncStorage';

const READING_PADDING_KEY = 'articleReadingPadding';
const DEFAULT_PADDING = 16;
const MIN_PADDING = 0;
const MAX_PADDING = 200;
const STEP = 8;

export default function useReadingWidth() {
  const {
    value: readingPadding,
    isLoading,
    updateValue,
  } = useAsyncStorage<number>(READING_PADDING_KEY, {
    defaultValue: DEFAULT_PADDING,
    validator: (val) => !isNaN(val) && val >= MIN_PADDING && val <= MAX_PADDING,
    serializer: (val) => String(val),
    deserializer: (val) => parseInt(val, 10),
  });

  const updateReadingPadding = useCallback(
    async (newPadding: number) => {
      const clampedPadding = Math.max(MIN_PADDING, Math.min(MAX_PADDING, newPadding));
      await updateValue(clampedPadding);
    },
    [updateValue]
  );

  const increaseReadingPadding = useCallback(
    () => updateReadingPadding(readingPadding + STEP),
    [readingPadding, updateReadingPadding]
  );
  const decreaseReadingPadding = useCallback(
    () => updateReadingPadding(readingPadding - STEP),
    [readingPadding, updateReadingPadding]
  );
  const resetReadingPadding = useCallback(
    () => updateReadingPadding(DEFAULT_PADDING),
    [updateReadingPadding]
  );

  return useMemo(
    () => ({
      readingPadding,
      isLoading,
      updateReadingPadding,
      increaseReadingPadding,
      decreaseReadingPadding,
      resetReadingPadding,
      canIncrease: readingPadding < MAX_PADDING,
      canDecrease: readingPadding > MIN_PADDING,
    }),
    [
      readingPadding,
      isLoading,
      updateReadingPadding,
      increaseReadingPadding,
      decreaseReadingPadding,
      resetReadingPadding,
    ]
  );
}
