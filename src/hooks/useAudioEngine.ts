import { useState, useRef, useEffect, useCallback } from 'react';

interface AudioEngineOptions {
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
}

export function useAudioEngine(options?: AudioEngineOptions) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsReady(true);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (options?.onEnded) {
        options.onEnded();
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
      audio.pause();
      audio.src = '';
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Request Animation Frame loop for smooth time updates
  const updateLoop = useCallback(
    function loop() {
      if (!audioRef.current) return;

      setCurrentTime(audioRef.current.currentTime);
      if (options?.onTimeUpdate) {
        options.onTimeUpdate(audioRef.current.currentTime);
      }

      if (!audioRef.current.paused) {
        rafRef.current = requestAnimationFrame(loop);
      }
    },
    [options],
  );

  useEffect(() => {
    if (isPlaying) {
      rafRef.current = requestAnimationFrame(updateLoop);
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      // Make sure time is updated when paused
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPlaying, updateLoop]);

  const loadAudio = useCallback((file: File) => {
    if (!audioRef.current) return;

    // Revoke previous object URL if any
    if (audioRef.current.src && audioRef.current.src.startsWith('blob:')) {
      URL.revokeObjectURL(audioRef.current.src);
    }

    const objectUrl = URL.createObjectURL(file);
    audioRef.current.src = objectUrl;
    audioRef.current.load();
    setIsReady(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const play = useCallback(async () => {
    if (!audioRef.current || !isReady) return;
    try {
      await audioRef.current.play();
    } catch (err) {
      console.error('Failed to play audio:', err);
    }
  }, [isReady]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  const seekTo = useCallback(
    (time: number) => {
      if (!audioRef.current) return;
      // ensure time is within bounds
      const clampedTime = Math.max(0, Math.min(time, duration));
      audioRef.current.currentTime = clampedTime;
      setCurrentTime(clampedTime);
      if (options?.onTimeUpdate) {
        options.onTimeUpdate(clampedTime);
      }
    },
    [duration, options],
  );

  return {
    isReady,
    isPlaying,
    currentTime,
    duration,
    loadAudio,
    play,
    pause,
    togglePlayPause,
    seekTo,
  };
}
