'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SyncedPlaybackState = {
  isPlaying: boolean;
  displayedText: string;
  fullText: string;
};

export const useSyncedPlayback = () => {
  const [state, setState] = useState<SyncedPlaybackState>({
    isPlaying: false,
    displayedText: '',
    fullText: '',
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const charIndexRef = useRef(0);
  const onCompleteRef = useRef<(() => void) | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const handleComplete = useCallback(() => {
    // Don't clear displayedText here - keep it visible until refetch completes
    // It will be cleared on next play() call
    setState((prev) => ({ ...prev, isPlaying: false }));
    cleanup();
    // Call onComplete callback if set
    if (onCompleteRef.current) {
      onCompleteRef.current();
      onCompleteRef.current = null;
    }
  }, [cleanup]);

  const stop = useCallback(() => {
    onCompleteRef.current = null; // Don't call onComplete when manually stopped
    cleanup();
    setState({ isPlaying: false, displayedText: '', fullText: '' });
  }, [cleanup]);

  const play = useCallback(
    (base64Audio: string, text: string, onComplete?: () => void) => {
      // Cleanup previous playback
      cleanup();
      onCompleteRef.current = onComplete ?? null;

      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audioRef.current = audio;
      charIndexRef.current = 0;

      setState({ isPlaying: true, displayedText: '', fullText: text });

      // Wait for audio metadata to get duration
      audio.onloadedmetadata = () => {
        const duration = audio.duration; // seconds
        const charsPerSecond = text.length / duration;
        const intervalMs = 1000 / charsPerSecond; // ms per character

        audio.play().catch(() => {
          // If autoplay blocked, call complete
          handleComplete();
        });

        // Start character-by-character reveal
        intervalRef.current = setInterval(() => {
          charIndexRef.current++;
          const displayed = text.slice(0, charIndexRef.current);

          setState((prev) => ({ ...prev, displayedText: displayed }));

          if (charIndexRef.current >= text.length) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
        }, intervalMs);
      };

      audio.onended = () => {
        handleComplete();
      };

      audio.onerror = () => {
        handleComplete();
      };
    },
    [cleanup, handleComplete]
  );

  const clear = useCallback(() => {
    setState((prev) => ({ ...prev, displayedText: '', fullText: '' }));
  }, []);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    play,
    stop,
    clear,
    isPlaying: state.isPlaying,
    displayedText: state.displayedText,
    fullText: state.fullText,
  };
};
