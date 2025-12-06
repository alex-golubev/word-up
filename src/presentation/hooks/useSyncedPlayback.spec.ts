import { act, renderHook } from '@testing-library/react';

import { useSyncedPlayback } from './useSyncedPlayback';

type MockAudio = {
  play: jest.Mock;
  pause: jest.Mock;
  onloadedmetadata: (() => void) | null;
  onended: (() => void) | null;
  onerror: (() => void) | null;
  duration: number;
};

const createMockAudio = (duration = 2): MockAudio => ({
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn(),
  onloadedmetadata: null,
  onended: null,
  onerror: null,
  duration,
});

let mockAudioInstance: MockAudio;

describe('useSyncedPlayback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Reset mock for each test
    mockAudioInstance = createMockAudio();
    global.Audio = jest.fn().mockImplementation(() => mockAudioInstance) as unknown as typeof Audio;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useSyncedPlayback());

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.displayedText).toBe('');
    expect(result.current.fullText).toBe('');
    expect(typeof result.current.play).toBe('function');
    expect(typeof result.current.stop).toBe('function');
    expect(typeof result.current.clear).toBe('function');
  });

  it('should set isPlaying and fullText when play is called', () => {
    const { result } = renderHook(() => useSyncedPlayback());

    act(() => {
      result.current.play('base64audio', 'Hello');
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.fullText).toBe('Hello');
    expect(result.current.displayedText).toBe('');
  });

  it('should create Audio with correct data URL', () => {
    const { result } = renderHook(() => useSyncedPlayback());

    act(() => {
      result.current.play('dGVzdA==', 'Test');
    });

    expect(global.Audio).toHaveBeenCalledWith('data:audio/mp3;base64,dGVzdA==');
  });

  it('should start playback and interval on loadedmetadata', () => {
    const { result } = renderHook(() => useSyncedPlayback());

    act(() => {
      result.current.play('audio', 'Hi');
      mockAudioInstance.onloadedmetadata?.();
    });

    expect(mockAudioInstance.play).toHaveBeenCalled();
  });

  it('should reveal text character by character', () => {
    mockAudioInstance.duration = 4; // 4 seconds for "Test" = 1 char/sec
    const { result } = renderHook(() => useSyncedPlayback());

    act(() => {
      result.current.play('audio', 'Test');
      mockAudioInstance.onloadedmetadata?.();
    });

    // After 1 second, should show 'T'
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.displayedText).toBe('T');

    // After 2 seconds, should show 'Te'
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.displayedText).toBe('Te');

    // After 4 seconds, should show 'Test'
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.displayedText).toBe('Test');
  });

  it('should call onComplete callback when audio ends', () => {
    const onComplete = jest.fn();
    const { result } = renderHook(() => useSyncedPlayback());

    act(() => {
      result.current.play('audio', 'Hi', onComplete);
      mockAudioInstance.onloadedmetadata?.();
    });

    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      mockAudioInstance.onended?.();
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(result.current.isPlaying).toBe(false);
  });

  it('should handle audio error by completing', () => {
    const onComplete = jest.fn();
    const { result } = renderHook(() => useSyncedPlayback());

    act(() => {
      result.current.play('audio', 'Hi', onComplete);
      mockAudioInstance.onerror?.();
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(result.current.isPlaying).toBe(false);
  });

  it('should handle autoplay blocked by completing', async () => {
    jest.useRealTimers(); // Use real timers for this async test

    const onComplete = jest.fn();
    mockAudioInstance.play = jest.fn().mockRejectedValue(new Error('Autoplay blocked'));

    const { result } = renderHook(() => useSyncedPlayback());

    act(() => {
      result.current.play('audio', 'Hi', onComplete);
    });

    await act(async () => {
      mockAudioInstance.onloadedmetadata?.();
    });

    // Wait for promise rejection to be handled
    await act(async () => {
      await Promise.resolve();
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(result.current.isPlaying).toBe(false);
  });

  it('should stop playback and clear state when stop is called', () => {
    const onComplete = jest.fn();
    const { result } = renderHook(() => useSyncedPlayback());

    act(() => {
      result.current.play('audio', 'Hello', onComplete);
      mockAudioInstance.onloadedmetadata?.();
    });

    expect(result.current.isPlaying).toBe(true);

    act(() => {
      result.current.stop();
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.displayedText).toBe('');
    expect(result.current.fullText).toBe('');
    expect(mockAudioInstance.pause).toHaveBeenCalled();
    // onComplete should NOT be called when manually stopped
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('should clear displayedText and fullText when clear is called', () => {
    mockAudioInstance.duration = 5;
    const { result } = renderHook(() => useSyncedPlayback());

    act(() => {
      result.current.play('audio', 'Hello');
      mockAudioInstance.onloadedmetadata?.();
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.displayedText).toBe('H');

    act(() => {
      result.current.clear();
    });

    expect(result.current.displayedText).toBe('');
    expect(result.current.fullText).toBe('');
  });

  it('should cleanup previous playback when play is called again', () => {
    const { result } = renderHook(() => useSyncedPlayback());

    act(() => {
      result.current.play('audio1', 'First');
      mockAudioInstance.onloadedmetadata?.();
    });

    const firstAudio = mockAudioInstance;

    // Create new mock for second play
    mockAudioInstance = createMockAudio();

    act(() => {
      result.current.play('audio2', 'Second');
    });

    expect(firstAudio.pause).toHaveBeenCalled();
    expect(result.current.fullText).toBe('Second');
  });

  it('should cleanup on unmount', () => {
    const { result, unmount } = renderHook(() => useSyncedPlayback());

    act(() => {
      result.current.play('audio', 'Test');
      mockAudioInstance.onloadedmetadata?.();
    });

    const audioInstance = mockAudioInstance;

    unmount();

    expect(audioInstance.pause).toHaveBeenCalled();
  });

  it('should clear interval when all text is revealed', () => {
    mockAudioInstance.duration = 2; // 2 seconds for "Hi" = 1 char/sec
    const { result } = renderHook(() => useSyncedPlayback());

    act(() => {
      result.current.play('audio', 'Hi');
      mockAudioInstance.onloadedmetadata?.();
    });

    // Reveal both characters
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.displayedText).toBe('Hi');

    // Further time advancement should not cause issues
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.displayedText).toBe('Hi');
  });

  it('should work with empty text (no karaoke)', () => {
    const { result } = renderHook(() => useSyncedPlayback());

    act(() => {
      result.current.play('audio', '');
      mockAudioInstance.onloadedmetadata?.();
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.fullText).toBe('');

    act(() => {
      mockAudioInstance.onended?.();
    });

    expect(result.current.isPlaying).toBe(false);
  });

  it('should not call onComplete twice', () => {
    const onComplete = jest.fn();
    const { result } = renderHook(() => useSyncedPlayback());

    act(() => {
      result.current.play('audio', 'Hi', onComplete);
      mockAudioInstance.onloadedmetadata?.();
    });

    act(() => {
      mockAudioInstance.onended?.();
    });

    // Try to trigger again
    act(() => {
      mockAudioInstance.onended?.();
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('should cleanup interval even if audio ref is null', () => {
    mockAudioInstance.duration = 2;
    const { result } = renderHook(() => useSyncedPlayback());

    act(() => {
      result.current.play('audio', 'Hi');
      mockAudioInstance.onloadedmetadata?.();
      jest.advanceTimersByTime(500);
    });

    // Stop clears both audio and interval
    act(() => {
      result.current.stop();
    });

    expect(result.current.isPlaying).toBe(false);
  });
});
