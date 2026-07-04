"use client";

import { useEffect, useRef, useCallback, useState } from "react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
    _ytApiLoaded?: boolean;
    _ytApiCallbacks?: (() => void)[];
  }
}

interface Props {
  videoId: string;
  itemId: string;
  initialPosition?: number;
  onProgressUpdate?: (percent: number, completed: boolean) => void;
}

function loadYouTubeAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (window._ytApiLoaded && window.YT?.Player) {
      resolve();
      return;
    }

    if (!window._ytApiCallbacks) {
      window._ytApiCallbacks = [];
    }
    window._ytApiCallbacks.push(resolve);

    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      return; // Script is loading, resolve will be called via callback
    }

    window.onYouTubeIframeAPIReady = () => {
      window._ytApiLoaded = true;
      window._ytApiCallbacks?.forEach((cb) => cb());
      window._ytApiCallbacks = [];
    };

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
}

export default function TrackedYouTubePlayer({
  videoId,
  itemId,
  initialPosition = 0,
  onProgressUpdate,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPostRef = useRef<number>(0);
  const [isReady, setIsReady] = useState(false);
  const [percent, setPercent] = useState(0);

  const postProgress = useCallback(
    async (watchedSeconds: number, duration: number) => {
      const now = Date.now();
      // Debounce: don't post more than once per 5s
      if (now - lastPostRef.current < 4500) return;
      lastPostRef.current = now;

      try {
        const res = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, watchedSeconds, duration }),
        });
        if (res.ok) {
          const data = await res.json();
          const pct = data.percent ?? 0;
          setPercent(pct);
          onProgressUpdate?.(pct, data.completed);
        }
      } catch (err) {
        console.error("Failed to post progress:", err);
      }
    },
    [itemId, onProgressUpdate]
  );

  const startTracking = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      const player = playerRef.current;
      if (!player?.getCurrentTime || !player?.getDuration) return;
      const current = player.getCurrentTime();
      const duration = player.getDuration();
      if (duration > 0) {
        postProgress(current, duration);
      }
    }, 5000);
  }, [postProgress]);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const playerId = `yt-player-${itemId}`;

    loadYouTubeAPI().then(() => {
      if (!mounted || !containerRef.current) return;

      // Ensure container has the placeholder div
      if (!document.getElementById(playerId)) {
        const div = document.createElement("div");
        div.id = playerId;
        containerRef.current.appendChild(div);
      }

      playerRef.current = new window.YT.Player(playerId, {
        videoId,
        height: "100%",
        width: "100%",
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
          start: Math.floor(initialPosition),
        },
        events: {
          onReady: () => {
            setIsReady(true);
            if (initialPosition > 0) {
              playerRef.current?.seekTo(initialPosition, true);
            }
          },
          onStateChange: (event: any) => {
            const state = event.data;
            if (state === window.YT.PlayerState.PLAYING) {
              startTracking();
            } else if (
              state === window.YT.PlayerState.PAUSED ||
              state === window.YT.PlayerState.ENDED
            ) {
              stopTracking();
              // Post final position
              const player = playerRef.current;
              if (player?.getCurrentTime && player?.getDuration) {
                postProgress(
                  player.getCurrentTime(),
                  player.getDuration()
                );
              }
            }
          },
        },
      });
    });

    return () => {
      mounted = false;
      stopTracking();
      playerRef.current?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, itemId]);

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/30"
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />
        </div>
      )}
      {percent > 0 && (
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-cyan-400 text-xs font-mono px-2 py-1 rounded-full">
          {Math.round(percent)}% watched
        </div>
      )}
    </div>
  );
}
