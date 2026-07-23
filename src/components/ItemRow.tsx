"use client";

import { useState, useCallback, useEffect } from "react";
import TrackedYouTubePlayer from "./TrackedYouTubePlayer";

interface Progress {
  id: string;
  completed: boolean;
  manuallyMarked: boolean;
  watchedSeconds: number | null;
  duration: number | null;
  percent: number | null;
  lastPosition: number | null;
}

interface Item {
  id: string;
  title: string;
  order: number;
  type: string;
  youtubeVideoId: string | null;
  playlistId: string | null;
  progress: Progress[];
}

interface Props {
  item: Item;
  onProgressChange: () => void;
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

export default function ItemRow({ item, onProgressChange }: Props) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const initialProgress = item.progress[0];
  
  // Real-time local state synchronized with player and database
  const [isCompleted, setIsCompleted] = useState<boolean>(initialProgress?.completed ?? false);
  const [watchPercent, setWatchPercent] = useState<number>(initialProgress?.percent ?? 0);
  const [lastPosition, setLastPosition] = useState<number>(initialProgress?.lastPosition ?? 0);

  // Read LocalStorage on mount as an instant cache fallback
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`mission_ml_pos_${item.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.percent && parsed.percent > watchPercent) {
            setWatchPercent(parsed.percent);
          }
          if (parsed?.watchedSeconds && parsed.watchedSeconds > lastPosition) {
            setLastPosition(parsed.watchedSeconds);
          }
        }
      } catch (e) {}
    }
  }, [item.id, watchPercent, lastPosition]);

  // Sync state if props change from outside
  useEffect(() => {
    const p = item.progress[0];
    if (p) {
      if (p.completed !== undefined) setIsCompleted(p.completed);
      if (p.percent !== null && p.percent > watchPercent) setWatchPercent(p.percent);
      if (p.lastPosition !== null && p.lastPosition > lastPosition) setLastPosition(p.lastPosition);
    }
  }, [item.progress, watchPercent, lastPosition]);

  const isVideo = item.type === "YOUTUBE_VIDEO" && item.youtubeVideoId;

  const toggleCompleted = useCallback(async () => {
    if (isToggling) return;
    setIsToggling(true);
    const targetState = !isCompleted;
    setIsCompleted(targetState); // Optimistic UI update

    try {
      await fetch("/api/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          completed: targetState,
        }),
      });
      onProgressChange();
    } catch (err) {
      console.error("Failed to toggle completed state:", err);
      setIsCompleted(!targetState); // Revert on failure
    } finally {
      setIsToggling(false);
    }
  }, [item.id, isCompleted, isToggling, onProgressChange]);

  const handleProgressUpdate = useCallback(
    (percent: number, watchedSeconds: number, duration: number, completed: boolean) => {
      setWatchPercent(percent);
      setLastPosition(watchedSeconds);
      if (completed && !isCompleted) {
        setIsCompleted(true);
        onProgressChange();
      }
    },
    [isCompleted, onProgressChange]
  );

  return (
    <div className="group w-full">
      {/* Item Row Header Bar */}
      <div
        className={`flex items-center gap-2.5 sm:gap-3.5 px-3 sm:px-4 py-3 rounded-xl transition-all duration-200 border ${
          showPlayer
            ? "bg-[#0f061e] border-[--color-accent-chartreuse]/50 shadow-[0_0_20px_rgba(206,255,50,0.1)]"
            : "border-white/5 hover:border-[--color-accent-pink]/30 bg-[#07030e]/60 hover:bg-[#0e051c]"
        } ${isVideo ? "cursor-pointer" : ""}`}
        onClick={() => {
          if (isVideo) setShowPlayer(!showPlayer);
        }}
      >
        {/* Checkbox Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCompleted();
          }}
          className={`flex-shrink-0 w-5 h-5 rounded-md border transition-all flex items-center justify-center cursor-pointer ${
            isCompleted
              ? "bg-[--color-accent-chartreuse] border-[--color-accent-chartreuse] check-pop shadow-[0_0_10px_rgba(206,255,50,0.3)]"
              : "border-white/20 hover:border-[--color-accent-pink]/60 bg-white/5"
          } ${isToggling ? "opacity-50" : ""}`}
          title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
        >
          {isCompleted && (
            <svg
              className="w-3.5 h-3.5 text-[#05020a] font-bold"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Order Index */}
        <span className="flex-shrink-0 text-xs text-[--color-text-muted] font-mono w-5 text-right">
          {item.order + 1}.
        </span>

        {/* Title */}
        <span
          className={`flex-1 text-xs sm:text-sm font-medium transition-colors line-clamp-2 ${
            isCompleted
              ? "text-[--color-text-muted] line-through decoration-[--color-accent-pink]/30"
              : "text-[--color-text-primary]"
          }`}
        >
          {item.title}
        </span>

        {/* Video progress indicator & play expand arrow */}
        {isVideo && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {watchPercent > 0 && (
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isCompleted
                    ? "bg-[--color-accent-chartreuse]/15 text-[--color-accent-chartreuse] border-[--color-accent-chartreuse]/25"
                    : "bg-[--color-accent-pink]/15 text-[--color-accent-pink] border-[--color-accent-pink]/25"
                }`}
              >
                {Math.round(watchPercent)}%
              </span>
            )}
            <div
              className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all ${
                showPlayer
                  ? "bg-[--color-accent-chartreuse] border-[--color-accent-chartreuse] text-[#05020a]"
                  : "bg-white/5 border-white/10 text-[--color-accent-pink] group-hover:border-[--color-accent-pink]/40"
              }`}
            >
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  showPlayer ? "rotate-90" : ""
                }`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {!isVideo && (
          <span className="flex-shrink-0 text-xs text-[--color-text-muted]">
            {item.type === "MANUAL_MILESTONE" ? "📌" : ""}
          </span>
        )}
      </div>

      {/* Expanded Large Video Player Surface */}
      {showPlayer && isVideo && item.youtubeVideoId && (
        <div className="expand-enter my-3 p-3 sm:p-5 rounded-2xl bg-[#06020c] border border-[--color-accent-pink]/25 shadow-2xl space-y-3">
          <TrackedYouTubePlayer
            videoId={item.youtubeVideoId}
            itemId={item.id}
            initialPosition={lastPosition}
            onProgressUpdate={handleProgressUpdate}
          />

          {/* Bottom Action & Stats Bar */}
          <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[--color-text-secondary]">
              <span>⏱ Position:</span>
              <span className="font-bold text-[--color-accent-chartreuse]">
                {formatTime(lastPosition)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCompleted();
                }}
                className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isCompleted
                    ? "bg-white/10 text-[--color-text-secondary] border border-white/15 hover:bg-white/20"
                    : "btn-gradient text-[#05020a] shadow-lg shadow-pink-500/20 hover:scale-102"
                }`}
              >
                {isCompleted ? "✓ Completed (Click to unmark)" : "✓ Mark as Watched"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
