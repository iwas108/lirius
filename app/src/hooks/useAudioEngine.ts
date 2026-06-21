import { useState, useRef, useEffect, useCallback } from 'react';

interface AudioEngineOptions {
  onTimeUpdate?: (time: number) => void;
  onEnded?: () => void;
}

interface YouTubePlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}

interface YTEvent {
  target: YouTubePlayer;
}

interface YTStateChangeEvent {
  data: number;
}

interface YTPlayerConstructor {
  new (
    elementId: string,
    options: {
      videoId: string;
      playerVars?: {
        autoplay?: number;
        controls?: number;
        modestbranding?: number;
        rel?: number;
        origin?: string;
        enablejsapi?: number;
      };
      events?: {
        onReady?: (event: YTEvent) => void;
        onStateChange?: (event: YTStateChangeEvent) => void;
      };
    },
  ): YouTubePlayer;
}

interface YTGlobal {
  Player: YTPlayerConstructor;
  ready(callback: () => void): void;
}

declare global {
  interface Window {
    YT?: YTGlobal;
  }
}

export function useAudioEngine(options?: AudioEngineOptions) {
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<YouTubePlayer | null>(null);
  const rafRef = useRef<number | null>(null);
  const activeVideoIdRef = useRef<string>('');

  const [playerType, setPlayerType] = useState<'html5' | 'youtube' | null>(
    null,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Initialize audio element for HTML5
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (playerType === 'html5') {
        setDuration(audio.duration);
        setIsReady(true);
      }
    };

    const handleEnded = () => {
      if (playerType === 'html5') {
        setIsPlaying(false);
        if (optionsRef.current?.onEnded) {
          optionsRef.current.onEnded();
        }
      }
    };

    const handlePause = () => {
      if (playerType === 'html5') {
        setIsPlaying(false);
      }
    };

    const handlePlay = () => {
      if (playerType === 'html5') {
        setIsPlaying(true);
      }
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
  }, [playerType]);

  // Handle YouTube player lifecycle, loading, and cleanup
  useEffect(() => {
    if (playerType !== 'youtube') return;

    console.log(
      '[AudioEngine] YouTube playerType active. Starting interval check...',
    );
    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts++;
      const container = document.getElementById('youtube-player-container');
      const hasYT = !!window.YT;
      const hasYTPlayer = !!(window.YT && window.YT.Player);
      const hasYTReady = !!(window.YT && window.YT.ready);

      if (attempts % 10 === 0 || hasYTPlayer) {
        console.log(
          `[AudioEngine] Attempt ${attempts}: YT=${hasYT}, YT.Player=${hasYTPlayer}, YT.ready=${hasYTReady}, container=${!!container}`,
        );
      }

      if (hasYT && hasYTPlayer && hasYTReady && container) {
        console.log(
          '[AudioEngine] All checks passed. Clearing interval and initializing YT.ready callback...',
        );
        clearInterval(interval);

        const ytGlobal = window.YT;
        if (ytGlobal && ytGlobal.ready) {
          ytGlobal.ready(() => {
            console.log(
              '[AudioEngine] YT.ready callback triggered inside useEffect!',
            );
            const yt = window.YT;
            if (!yt) {
              console.error(
                '[AudioEngine] window.YT is undefined inside ready callback!',
              );
              return;
            }

            const curContainer = document.getElementById(
              'youtube-player-container',
            );
            if (!curContainer) {
              console.error(
                '[AudioEngine] youtube-player-container not found inside ready callback!',
              );
              return;
            }

            let el = document.getElementById('youtube-player');
            if (!el) {
              console.log('[AudioEngine] Creating youtube-player div...');
              el = document.createElement('div');
              el.id = 'youtube-player';
              el.className = 'w-full h-full';
              curContainer.appendChild(el);
            } else {
              console.log('[AudioEngine] youtube-player div already exists');
            }

            if (ytPlayerRef.current) {
              try {
                console.log(
                  '[AudioEngine] Destroying previous YT player instance...',
                );
                ytPlayerRef.current.destroy();
              } catch (e) {
                console.warn(
                  '[AudioEngine] Failed to destroy previous YT player',
                  e,
                );
              }
            }

            console.log(
              '[AudioEngine] Instantiating new YT.Player inside useEffect with videoId:',
              activeVideoIdRef.current,
            );
            try {
              ytPlayerRef.current = new yt.Player('youtube-player', {
                videoId: activeVideoIdRef.current,
                playerVars: {
                  autoplay: 0,
                  controls: 1,
                  modestbranding: 1,
                  rel: 0,
                  enablejsapi: 1,
                  origin: window.location.origin,
                },
                events: {
                  onReady: (event: YTEvent) => {
                    console.log('[AudioEngine] YT Player onReady triggered!');
                    setDuration(event.target.getDuration());
                    setIsReady(true);
                  },
                  onStateChange: (event: YTStateChangeEvent) => {
                    console.log(
                      '[AudioEngine] YT Player onStateChange:',
                      event.data,
                    );
                    // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
                    if (event.data === 1) {
                      setIsPlaying(true);
                    } else if (event.data === 2) {
                      setIsPlaying(false);
                    } else if (event.data === 0) {
                      setIsPlaying(false);
                      if (optionsRef.current?.onEnded)
                        optionsRef.current.onEnded();
                    }
                  },
                },
              });
              console.log(
                '[AudioEngine] YT.Player constructor called successfully',
              );
            } catch (err) {
              console.error(
                '[AudioEngine] Error calling YT.Player constructor:',
                err,
              );
            }
          });
        }
      } else if (attempts > 100) {
        console.warn(
          '[AudioEngine] Timeout waiting for YT Player API or container. Clearing interval.',
        );
        clearInterval(interval);
      }
    }, 100);

    return () => {
      console.log(
        '[AudioEngine] Cleaning up YouTube player/interval on unmount/change',
      );
      clearInterval(interval);
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {
          console.warn(
            '[AudioEngine] Failed to destroy YT player on cleanup',
            e,
          );
        }
        ytPlayerRef.current = null;
      }
    };
  }, [playerType]);

  // Request Animation Frame loop for smooth time updates (HTML5)
  const updateLoop = useCallback(
    function loop() {
      if (!audioRef.current || playerType !== 'html5') return;

      setCurrentTime(audioRef.current.currentTime);
      if (optionsRef.current?.onTimeUpdate) {
        optionsRef.current.onTimeUpdate(audioRef.current.currentTime);
      }

      if (!audioRef.current.paused) {
        rafRef.current = requestAnimationFrame(loop);
      }
    },
    [playerType],
  );

  useEffect(() => {
    if (isPlaying && playerType === 'html5') {
      rafRef.current = requestAnimationFrame(updateLoop);
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      // Make sure time is updated when paused
      if (audioRef.current && playerType === 'html5') {
        setCurrentTime(audioRef.current.currentTime);
      }
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPlaying, updateLoop, playerType]);

  // Loop for YouTube time updates
  useEffect(() => {
    if (playerType !== 'youtube' || !isPlaying) return;

    let active = true;
    const updateTime = () => {
      if (
        !active ||
        !ytPlayerRef.current ||
        typeof ytPlayerRef.current.getCurrentTime !== 'function'
      )
        return;

      try {
        const time = ytPlayerRef.current.getCurrentTime();
        setCurrentTime(time);
        if (optionsRef.current?.onTimeUpdate) {
          optionsRef.current.onTimeUpdate(time);
        }
      } catch (e) {
        console.error('Error getting YT time:', e);
      }

      rafRef.current = requestAnimationFrame(updateTime);
    };

    rafRef.current = requestAnimationFrame(updateTime);
    return () => {
      active = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPlaying, playerType]);

  const loadAudio = useCallback((file: File) => {
    setPlayerType('html5');
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
    setIsPlaying(false);
  }, []);

  const loadYouTube = useCallback((videoId: string) => {
    // Clean up HTML5 audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    console.log('[AudioEngine] loadYouTube called with videoId:', videoId);
    activeVideoIdRef.current = videoId;
    setPlayerType('youtube');
    setIsReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    // Load YouTube iframe script if not already present
    if (!window.YT) {
      console.log(
        '[AudioEngine] window.YT is not present, injecting script...',
      );
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    } else {
      console.log(
        '[AudioEngine] window.YT is already present:',
        typeof window.YT,
      );
    }
  }, []);

  const play = useCallback(async () => {
    if (playerType === 'youtube') {
      if (ytPlayerRef.current && isReady) {
        ytPlayerRef.current.playVideo();
      }
      return;
    }
    if (!audioRef.current || !isReady) return;
    try {
      await audioRef.current.play();
    } catch (err) {
      console.error('Failed to play audio:', err);
    }
  }, [isReady, playerType]);

  const pause = useCallback(() => {
    if (playerType === 'youtube') {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.pauseVideo();
      }
      return;
    }
    if (!audioRef.current) return;
    audioRef.current.pause();
  }, [playerType]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  const seekTo = useCallback(
    (time: number) => {
      const clampedTime = Math.max(0, Math.min(time, duration));
      if (playerType === 'youtube') {
        if (ytPlayerRef.current && isReady) {
          ytPlayerRef.current.seekTo(clampedTime, true);
          setCurrentTime(clampedTime);
          if (optionsRef.current?.onTimeUpdate) {
            optionsRef.current.onTimeUpdate(clampedTime);
          }
        }
        return;
      }
      if (!audioRef.current) return;
      audioRef.current.currentTime = clampedTime;
      setCurrentTime(clampedTime);
      if (optionsRef.current?.onTimeUpdate) {
        optionsRef.current.onTimeUpdate(clampedTime);
      }
    },
    [duration, playerType, isReady],
  );

  return {
    isReady,
    isPlaying,
    currentTime,
    duration,
    loadAudio,
    loadYouTube,
    play,
    pause,
    togglePlayPause,
    seekTo,
  };
}
