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
  BOOK: "📖",
};

const kindLabels: Record<string, string> = {
  COURSE_MANUAL: "Course",
  SINGLE_VIDEO: "Videos",
  PLAYLIST: "Playlist",
  BOOK: "Book",
};

export default function TopicCard({ topic, onProgressChange }: Props) {
  const [showModal, setShowModal] = useState(false);

  const totalItems = topic.items.length;
  const completedItems = topic.items.filter((item) =>
    item.progress.some((p) => p.completed)
  ).length;
  const progressPercent =
    totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <>
      {/* Small vertical card */}
      <div
        onClick={() => setShowModal(true)}
        className="flex-shrink-0 w-72 h-64 p-6 glass-card border border-[--color-border-glass] rounded-2xl flex flex-col justify-between cursor-pointer group hover:-translate-y-2 hover:border-[--color-accent-chartreuse]/40 hover:shadow-[0_0_35px_rgba(206,255,50,0.1)] transition-all duration-300 relative overflow-hidden select-none"
      >
        {/* Animated accent shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Top Info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[--color-accent-pink]/10 border border-[--color-accent-pink]/20 flex items-center justify-center text-2xl shadow-[0_0_15px_rgba(236,43,122,0.15)] group-hover:scale-110 transition-transform duration-300">
              {kindIcons[topic.kind] ?? "📌"}
            </div>
            <span className="text-[9px] uppercase tracking-widest font-black text-[--color-accent-carnation] bg-[--color-accent-pink]/10 border border-[--color-accent-pink]/25 px-3 py-1 rounded-full">
              {kindLabels[topic.kind] ?? topic.kind}
            </span>
          </div>

          <h3 className="font-bold text-[--color-text-primary] text-lg leading-snug group-hover:text-[--color-accent-chartreuse] transition-colors duration-300 line-clamp-3">
            {topic.title}
          </h3>

          {topic.title.toLowerCase().includes("mlops") && (
            <a
              href="https://github.com/kirtagyacse-droid/mlops-zoomcamp"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#180a2b] border border-[--color-accent-pink]/30 text-[--color-accent-carnation] hover:text-[--color-accent-chartreuse] hover:border-[--color-accent-chartreuse]/50 transition-all shadow-sm shrink-0"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>MLOps Repo ↗</span>
            </a>
          )}
        </div>

        {/* Bottom Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[--color-text-muted] font-medium">Progress</span>
            <span className="text-[--color-text-secondary] font-bold">
              <span className={completedItems === totalItems && totalItems > 0 ? "text-[--color-accent-chartreuse]" : "text-[--color-accent-pink]"}>
                {completedItems}
              </span>
              <span className="text-[--color-text-muted] font-normal">/</span>
              {totalItems}
            </span>
          </div>

          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div
              className="progress-fill h-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist Pop-up Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => setShowModal(false)}
            className="absolute inset-0 bg-[#04010a]/90 backdrop-blur-md transition-all duration-300"
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-5xl max-h-[92vh] sm:max-h-[90vh] bg-[#0c0418]/95 border border-[--color-accent-pink]/25 rounded-3xl p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-6 shadow-[0_0_60px_rgba(236,43,122,0.2)] overflow-hidden scale-in">
            {/* Holographic scanner effect line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[--color-accent-pink] to-transparent animate-pulse" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{kindIcons[topic.kind] ?? "📌"}</span>
                  <span className="text-[9px] uppercase tracking-widest font-black text-[--color-accent-chartreuse] bg-[--color-accent-chartreuse]/10 border border-[--color-accent-chartreuse]/20 px-3 py-1 rounded-full">
                    {kindLabels[topic.kind] ?? topic.kind}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[--color-text-primary] mt-2 leading-tight">
                  {topic.title}
                </h2>
                {topic.title.toLowerCase().includes("mlops") && (
                  <div className="pt-2">
                    <a
                      href="https://github.com/kirtagyacse-droid/mlops-zoomcamp"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#180a2b] border border-[--color-accent-pink]/40 text-[--color-accent-carnation] hover:text-[--color-accent-chartreuse] hover:border-[--color-accent-chartreuse]/60 transition-all shadow-md"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      <span>Open MLOps Zoomcamp GitHub Repository ↗</span>
                    </a>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[--color-text-secondary] hover:text-[--color-accent-pink] hover:border-[--color-accent-pink]/30 hover:scale-105 transition-all duration-200 cursor-pointer"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Overall Progress Indicator */}
            <div className="p-4 bg-[#120724]/40 border border-white/5 rounded-2xl flex items-center justify-between gap-6">
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[--color-text-secondary]">Completion Progress</span>
                  <span className="font-bold text-[--color-accent-chartreuse]">{Math.round(progressPercent)}%</span>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="progress-fill h-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              <div className="text-center font-mono">
                <div className="text-2xl font-black text-[--color-text-primary]">
                  {completedItems}
                </div>
                <div className="text-[8px] uppercase tracking-wider text-[--color-text-muted] font-bold">
                  of {totalItems} items
                </div>
              </div>
            </div>

            {/* Scrollable Checklist Items */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
              {topic.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onProgressChange={onProgressChange}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
