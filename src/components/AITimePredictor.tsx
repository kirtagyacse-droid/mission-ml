"use client";

import { useState, useEffect } from "react";

interface TopicBreakdown {
  topicId: string;
  topicTitle: string;
  totalItems: number;
  completedItems: number;
  remainingItems: number;
  contentHours: number;
  actualClockHours: number;
  targetDate: string;
}

interface AIETAData {
  totalContentHoursRemaining: number;
  actualClockHoursRemaining: number;
  playbackSpeedFactor: number;
  daysRemaining: number;
  estimatedCompletionDate: string;
  formattedDate: string;
  detectedHoursPerDay: number;
  completedItemsCount: number;
  totalItemsCount: number;
  aiReasoning: string;
  topicBreakdowns: TopicBreakdown[];
}

export default function AITimePredictor() {
  const [data, setData] = useState<AIETAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const fetchAIETA = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai-eta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error("Failed to fetch AI ETA:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIETA();
  }, []);

  return (
    <div className="glass-card neon-glow-border-active p-6 mb-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="glow-orb orb-chartreuse" style={{ top: "-20%", right: "-10%", width: 300, height: 300, opacity: 0.12 }} />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        {/* Left Side: Header & AI Target Date */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase rounded-full bg-[rgba(206,255,50,0.12)] border border-[rgba(206,255,50,0.3)] text-[--color-accent-chartreuse]">
              🤖 AI Completion Predictor
            </span>
            <span className="text-xs text-[--color-text-muted] font-medium">Speed-Aware Forecast Engine</span>
          </div>

          <div className="flex items-baseline gap-3 pt-1">
            {loading ? (
              <div className="h-9 w-48 bg-white/5 animate-pulse rounded-lg" />
            ) : (
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[--color-text-primary] tracking-tight">
                {data?.formattedDate || "Calculating..."}
              </h2>
            )}
            <span className="text-xs text-[--color-text-muted] font-medium">
              ({data?.daysRemaining || 0} days remaining)
            </span>
          </div>

          <p className="text-xs text-[--color-text-secondary] max-w-xl leading-relaxed">
            Analyzes your actual video playback speed factor, watch history, and course difficulty to predict your exact finish date.
          </p>
        </div>

        {/* Right Side: Automatically Assessed Pace & Playback Speed Badges */}
        <div className="flex flex-col sm:items-end gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Playback speed factor badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[rgba(206,255,50,0.08)] border border-[rgba(206,255,50,0.25)] text-xs text-[--color-accent-chartreuse] font-bold">
              <span>🚀 Playback Speed:</span>
              <span className="text-white text-sm font-black">
                {data?.playbackSpeedFactor || 1.35}x
              </span>
            </div>

            {/* Daily Pace Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[rgba(236,43,122,0.1)] border border-[rgba(236,43,122,0.25)] text-xs text-[--color-accent-carnation] font-bold">
              <span>⚡ Daily Pace:</span>
              <span className="text-[--color-accent-chartreuse] text-sm">
                {data?.detectedHoursPerDay || 1.5} hrs/day
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-[--color-text-muted] pt-1">
            <span>⏳ <strong>{data?.totalContentHoursRemaining || 0}h</strong> content → <strong>{data?.actualClockHoursRemaining || 0}h</strong> real study time</span>
            <span>•</span>
            <span>📚 <strong>{data?.completedItemsCount || 0} / {data?.totalItemsCount || 0}</strong> items</span>
          </div>
        </div>
      </div>

      {/* AI Reasoning Box */}
      {data?.aiReasoning && (
        <div className="mt-5 p-4 rounded-xl bg-[#090314]/80 border border-[rgba(236,43,122,0.2)] text-xs text-[--color-text-secondary] leading-relaxed flex items-start gap-3">
          <span className="text-base leading-none">💡</span>
          <div className="flex-1">
            <strong className="text-[--color-accent-pink] font-semibold">AI Speed & Workload Insights: </strong>
            <span>{data.aiReasoning}</span>
          </div>
          <button
            onClick={fetchAIETA}
            disabled={loading}
            className="text-[11px] text-[--color-text-muted] hover:text-[--color-text-primary] underline shrink-0 cursor-pointer"
            title="Recalculate AI forecast"
          >
            {loading ? "Refreshing…" : "↻ Refresh AI"}
          </button>
        </div>
      )}

      {/* Toggle Course Breakdown Accordion */}
      {data?.topicBreakdowns && data.topicBreakdowns.length > 0 && (
        <div className="mt-4 border-t border-white/5 pt-3">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="text-xs font-semibold text-[--color-text-secondary] hover:text-[--color-accent-chartreuse] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{showBreakdown ? "▼ Hide Per-Course Target Dates" : "► View Per-Course Target Dates Breakdown"}</span>
          </button>

          {showBreakdown && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3 animate-fadeIn">
              {data.topicBreakdowns.map((tb) => (
                <div
                  key={tb.topicId}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col justify-between gap-1 text-xs"
                >
                  <span className="font-semibold text-[--color-text-primary] truncate">
                    {tb.topicTitle}
                  </span>
                  <div className="flex items-center justify-between text-[--color-text-muted] pt-1">
                    <span>{tb.contentHours}h content → ~{tb.actualClockHours}h study</span>
                    <span className="font-bold text-[--color-accent-carnation]">
                      {tb.targetDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
