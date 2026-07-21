"use client";

import { useState, useCallback } from "react";
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

export default function ItemRow({ item, onProgressChange }: Props) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const progress = item.progress[0];
  const isCompleted = progress?.completed ?? false;
  const watchPercent = progress?.percent ?? 0;
  const lastPosition = progress?.lastPosition ?? 0;
  const isVideo = item.type === "YOUTUBE_VIDEO" && item.youtubeVideoId;

  const toggleCompleted = useCallback(async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await fetch("/api/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          completed: !isCompleted,
        }),
      });
      onProgressChange();
    } catch (err) {
      console.error("Failed to toggle:", err);
    } finally {
      setIsToggling(false);
    }
  }, [item.id, isCompleted, isToggling, onProgressChange]);

  const handleProgressUpdate = useCallback(
    (percent: number, completed: boolean) => {
      if (completed) {
        onProgressChange();
      }
    },
    [onProgressChange]
  );

  return (
    <div className="group">
      <div
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 border-l-2 ${
          showPlayer 
            ? "bg-[#0d0417]/50 border-[--color-accent-chartreuse]" 
            : "border-transparent hover:border-[--color-accent-pink]/30"
        } ${
          isVideo
            ? "hover:bg-[--color-accent-pink]/5 cursor-pointer"
            : "hover:bg-[--color-accent-pink]/3"
        }`}
        onClick={() => {
          if (isVideo) setShowPlayer(!showPlayer);
        }}
      >
        {/* Checkbox / Checkmark */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCompleted();
          }}
          className={`flex-shrink-0 w-5 h-5 rounded-md border transition-all flex items-center justify-center cursor-pointer ${
            isCompleted
              ? "bg-[--color-accent-chartreuse] border-[--color-accent-chartreuse] check-pop"
              : "border-white/10 hover:border-[--color-accent-pink]/40"
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>

        {/* Order number */}
        <span className="flex-shrink-0 text-xs text-[--color-text-muted] font-mono w-6 text-right">
          {item.order + 1}.
        </span>

        {/* Title */}
        <span
          className={`flex-1 text-sm truncate transition-colors ${
            isCompleted
              ? "text-[--color-text-muted] line-through decoration-[--color-accent-pink]/25"
              : "text-[--color-text-primary]"
          }`}
        >
          {item.title}
        </span>

        {/* Video indicator / percent badge */}
        {isVideo && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {watchPercent > 0 && watchPercent < 90 && (
              <span className="text-[10px] font-mono text-[--color-accent-chartreuse] bg-[--color-accent-chartreuse]/10 px-1.5 py-0.5 rounded-full border border-[--color-accent-chartreuse]/10">
                {Math.round(watchPercent)}%
              </span>
            )}
            <svg
              className={`w-4.5 h-4.5 transition-transform ${
                showPlayer ? "rotate-90" : ""
              } ${
                isCompleted
                  ? "text-[--color-accent-chartreuse] drop-shadow-[0_0_5px_rgba(206,255,50,0.3)]"
                  : "text-[--color-accent-pink]"
              }`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}

        {/* Manual milestone icon */}
        {!isVideo && (
          <span className="flex-shrink-0 text-xs text-[--color-text-muted]">
            {item.type === "MANUAL_MILESTONE" ? "📌" : ""}
          </span>
        )}
      </div>

      {/* Inline YouTube Player */}
      {showPlayer && isVideo && item.youtubeVideoId && (
        <div className="expand-enter mx-3 mb-3 mt-2 p-3 rounded-xl bg-[#07030d] border border-[--color-border-glass] shadow-inner">
          <TrackedYouTubePlayer
            videoId={item.youtubeVideoId}
            itemId={item.id}
            initialPosition={lastPosition}
            onProgressUpdate={handleProgressUpdate}
          />
          <div className="mt-2.5 flex items-center justify-between px-1">
            <p className="text-[10px] text-[--color-text-muted]">
              {lastPosition > 0
                ? `Resuming from ${formatTime(lastPosition)}`
                : "Start watching to track progress"}
            </p>
            {!isCompleted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCompleted();
                }}
                className="text-[10px] font-bold text-[--color-accent-carnation] hover:text-[--color-accent-chartreuse] transition-colors cursor-pointer"
              >
                ✓ Mark as watched
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
