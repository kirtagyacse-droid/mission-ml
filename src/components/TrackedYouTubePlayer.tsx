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
  onProgressUpdate?: (
    percent: number,
    watchedSeconds: number,
    duration: number,
    completed: boolean
  ) => void;
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
      return;
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

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
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
  const hasSoughtRef = useRef<boolean>(false);
  const lastPositionRef = useRef<number>(initialPosition);
  const lastDurationRef = useRef<number>(0);

  const [isReady, setIsReady] = useState(false);
  const [percent, setPercent] = useState(0);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [duration, setDuration] = useState(0);

  // Compute effective initial position (merging DB initialPosition and LocalStorage)
  const getEffectiveInitialPos = useCallback(() => {
    let pos = initialPosition || 0;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`mission_ml_pos_${itemId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.watchedSeconds && parsed.watchedSeconds > pos) {
            pos = parsed.watchedSeconds;
          }
        }
      } catch (e) {}
    }
    return pos;
  }, [initialPosition, itemId]);

  const targetStartPos = getEffectiveInitialPos();

  const postProgress = useCallback(
    async (watchedSeconds: number, dur: number, force = false) => {
      if (!watchedSeconds || watchedSeconds <= 0) return;
      const now = Date.now();
      if (!force && now - lastPostRef.current < 3500) return;
      lastPostRef.current = now;

      lastPositionRef.current = watchedSeconds;
      if (dur > 0) lastDurationRef.current = dur;

      const computedPercent = dur > 0 ? (watchedSeconds / dur) * 100 : 0;
      setPercent(computedPercent);
      setCurrentTime(watchedSeconds);
      if (dur > 0) setDuration(dur);

      // 1. Instant LocalStorage Save
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            `mission_ml_pos_${itemId}`,
            JSON.stringify({
              watchedSeconds,
              duration: dur,
              percent: computedPercent,
              timestamp: now,
            })
          );
        } catch (e) {}
      }

      // 2. Notify Parent Component Immediately
      const threshold = 90;
      const shouldComplete = computedPercent >= threshold;
      onProgressUpdate?.(computedPercent, watchedSeconds, dur, shouldComplete);

      // 3. Post to DB API
      try {
        const res = await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId, watchedSeconds, duration: dur }),
        });
        if (res.ok) {
          const data = await res.json();
          const pct = data.percent ?? computedPercent;
          setPercent(pct);
          onProgressUpdate?.(pct, watchedSeconds, dur, data.completed);
        }
      } catch (err) {
        console.warn("Progress post error (saved locally):", err);
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
      const dur = player.getDuration();
      if (dur > 0) {
        postProgress(current, dur);
      }
    }, 3000);
  }, [postProgress]);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleSeekToStart = useCallback(() => {
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(0, true);
      postProgress(0, lastDurationRef.current || duration, true);
    }
  }, [duration, postProgress]);

  const performInitialSeek = useCallback(() => {
    if (hasSoughtRef.current) return;
    const player = playerRef.current;
    if (player && targetStartPos > 2) {
      try {
        player.seekTo(targetStartPos, true);
        hasSoughtRef.current = true;
      } catch (e) {}
    }
  }, [targetStartPos]);

  useEffect(() => {
    let mounted = true;
    const playerId = `yt-player-${itemId}`;

    loadYouTubeAPI().then(() => {
      if (!mounted || !containerRef.current) return;

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
          start: Math.floor(targetStartPos),
        },
        events: {
          onReady: () => {
            if (!mounted) return;
            setIsReady(true);
            performInitialSeek();
          },
          onStateChange: (event: any) => {
            const state = event.data;
            performInitialSeek();

            if (state === window.YT.PlayerState.PLAYING) {
              startTracking();
            } else if (
              state === window.YT.PlayerState.PAUSED ||
              state === window.YT.PlayerState.ENDED
            ) {
              stopTracking();
              const player = playerRef.current;
              if (player?.getCurrentTime && player?.getDuration) {
                postProgress(player.getCurrentTime(), player.getDuration(), true);
              }
            }
          },
        },
      });
    });

    const handleBeforeUnload = () => {
      const player = playerRef.current;
      if (player?.getCurrentTime && player?.getDuration) {
        const current = player.getCurrentTime();
        const dur = player.getDuration();
        if (current > 0 && dur > 0) {
          navigator.sendBeacon?.(
            "/api/progress",
            JSON.stringify({ itemId, watchedSeconds: current, duration: dur })
          );
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      mounted = false;
      window.removeEventListener("beforeunload", handleBeforeUnload);
      stopTracking();
      // Send final position check before destroying
      const player = playerRef.current;
      if (player?.getCurrentTime && player?.getDuration) {
        const current = player.getCurrentTime();
        const dur = player.getDuration();
        if (current > 0 && dur > 0) {
          postProgress(current, dur, true);
        }
      }
      playerRef.current?.destroy?.();
    };
  }, [videoId, itemId, targetStartPos, performInitialSeek, startTracking, stopTracking, postProgress]);

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Sleek Top Info HUD Bar above player (NO floating overlay on YouTube iframe) */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/40 rounded-xl border border-white/5 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[--color-accent-chartreuse] animate-pulse" />
          <span className="text-[--color-text-secondary] font-medium">
            {percent > 0 ? `${Math.round(percent)}% watched` : "Ready to watch"}
          </span>
          {currentTime > 5 && (
            <span className="text-[--color-accent-pink] font-bold">
              · Resuming from {formatTime(currentTime)}
            </span>
          )}
        </div>
        {currentTime > 10 && (
          <button
            onClick={handleSeekToStart}
            className="text-[10px] text-[--color-text-muted] hover:text-[--color-accent-chartreuse] transition-colors cursor-pointer border border-white/10 hover:border-[--color-accent-chartreuse]/40 px-2 py-0.5 rounded-md"
            title="Start video from 0:00"
          >
            ↻ Restart from 0:00
          </button>
        )}
      </div>

      {/* Video Container Surface */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/60 shadow-2xl border border-white/10">
        <div ref={containerRef} className="w-full h-full" />
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-xl backdrop-blur-sm z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin w-9 h-9 border-3 border-[--color-accent-pink] border-t-transparent rounded-full" />
              <span className="text-xs text-[--color-text-secondary] font-mono">Loading HD Player...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
