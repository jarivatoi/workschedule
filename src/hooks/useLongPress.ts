import { useCallback, useRef } from 'react';

interface LongPressOptions {
  onLongPress: () => void;
  onPress?: () => void;
  delay?: number;
}

interface LongPressHandlers {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onTouchCancel: () => void;
}

/**
 * Custom hook for handling long-press interactions
 * @param options - Configuration options for long-press behavior
 * @returns Event handlers for mouse and touch events
 */
export const useLongPress = ({
  onLongPress,
  onPress,
  delay = 500
}: LongPressOptions): LongPressHandlers => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const startLongPress = useCallback(() => {
    isLongPressRef.current = false;
    
    timeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const cancelLongPress = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handlePress = useCallback(() => {
    if (!isLongPressRef.current && onPress) {
      onPress();
    }
    isLongPressRef.current = false;
  }, [onPress]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startLongPress();
  }, [startLongPress]);

  const onMouseUp = useCallback(() => {
    cancelLongPress();
    handlePress();
  }, [cancelLongPress, handlePress]);

  const onMouseLeave = useCallback(() => {
    cancelLongPress();
  }, [cancelLongPress]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    startLongPress();
  }, [startLongPress]);

  const onTouchEnd = useCallback(() => {
    cancelLongPress();
    handlePress();
  }, [cancelLongPress, handlePress]);

  const onTouchCancel = useCallback(() => {
    cancelLongPress();
  }, [cancelLongPress]);

  return {
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchEnd,
    onTouchCancel
  };
};