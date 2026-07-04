"use client";

import { useState } from "react";
import ItemRow from "./ItemRow";

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

interface Topic {
  id: string;
  title: string;
  order: number;
  kind: string;
  items: Item[];
}

interface Props {
  topic: Topic;
  onProgressChange: () => void;
}

const kindIcons: Record<string, string> = {
  COURSE_MANUAL: "📚",
  SINGLE_VIDEO: "🎬",
  PLAYLIST: "📋",
};

const kindLabels: Record<string, string> = {
  COURSE_MANUAL: "Course",
  SINGLE_VIDEO: "Videos",
  PLAYLIST: "Playlist",
};

export default function TopicCard({ topic, onProgressChange }: Props) {
  const [expanded, setExpanded] = useState(false);

  const totalItems = topic.items.length;
  const completedItems = topic.items.filter((item) =>
    item.progress.some((p) => p.completed)
  ).length;
  const progressPercent =
    totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="glass-card overflow-hidden">
      {/* Header — clickable to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 sm:p-6 flex items-center gap-4 text-left group"
      >
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
          {kindIcons[topic.kind] ?? "📌"}
        </div>

        {/* Title & meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-semibold text-[--color-text-primary] truncate text-base sm:text-lg">
              {topic.title}
            </h2>
            <span className="flex-shrink-0 text-[10px] uppercase tracking-wider text-[--color-text-muted] bg-white/5 px-2 py-0.5 rounded-full">
              {kindLabels[topic.kind] ?? topic.kind}
            </span>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="progress-fill h-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="flex-shrink-0 text-xs font-mono text-[--color-text-secondary]">
              <span
                className={
                  completedItems === totalItems && totalItems > 0
                    ? "text-[--color-accent-green]"
                    : "text-[--color-accent-cyan]"
                }
              >
                {completedItems}
              </span>
              /{totalItems}
            </span>
          </div>
        </div>

        {/* Expand arrow */}
        <div
          className={`flex-shrink-0 w-6 h-6 flex items-center justify-center text-[--color-text-muted] transition-transform duration-300 ${
            expanded ? "rotate-180" : ""
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Items list — expandable */}
      {expanded && (
        <div className="expand-enter border-t border-white/5">
          <div className="p-3 sm:p-4 space-y-1">
            {topic.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onProgressChange={onProgressChange}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
