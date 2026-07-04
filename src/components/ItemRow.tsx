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
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
          isVideo
            ? "hover:bg-white/5 cursor-pointer"
            : "hover:bg-white/3"
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
          className={`flex-shrink-0 w-5 h-5 rounded-md border transition-all flex items-center justify-center ${
            isCompleted
              ? "bg-[--color-accent-green] border-[--color-accent-green] check-pop"
              : "border-white/20 hover:border-white/40"
          } ${isToggling ? "opacity-50" : ""}`}
          title={isCompleted ? "Mark as incomplete" : "Mark as complete"}
        >
          {isCompleted && (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
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
              ? "text-[--color-text-muted] line-through"
              : "text-[--color-text-primary]"
          }`}
        >
          {item.title}
        </span>

        {/* Video indicator / percent badge */}
        {isVideo && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {watchPercent > 0 && watchPercent < 90 && (
              <span className="text-[10px] font-mono text-[--color-accent-cyan] bg-cyan-500/10 px-1.5 py-0.5 rounded-full">
                {Math.round(watchPercent)}%
              </span>
            )}
            <svg
              className={`w-4 h-4 transition-transform ${
                showPlayer ? "rotate-90" : ""
              } ${
                isCompleted
                  ? "text-[--color-accent-green]"
                  : "text-[--color-text-muted]"
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
        <div className="expand-enter mx-3 mb-3 mt-1">
          <TrackedYouTubePlayer
            videoId={item.youtubeVideoId}
            itemId={item.id}
            initialPosition={lastPosition}
            onProgressUpdate={handleProgressUpdate}
          />
          <div className="mt-2 flex items-center justify-between px-1">
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
                className="text-[10px] text-[--color-text-muted] hover:text-[--color-accent-green] transition-colors"
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
