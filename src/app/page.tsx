"use client";

// Mock useSession to bypass Google Sign-in and automatically load the dashboard
const useSession = () => ({
  data: { user: { email: "kirtagyacse2@gmail.com", name: "Kirtagya", image: null as string | null } },
  status: "authenticated" as "authenticated" | "loading" | "unauthenticated",
});
const signIn = (provider?: string) => {};
const signOut = () => {};
import { useEffect, useState, useCallback } from "react";
import TopicCard from "@/components/TopicCard";
import AITimePredictor from "@/components/AITimePredictor";

interface Progress {
  id: string;
  completed: boolean;
  manuallyMarked: boolean;
  watchedSeconds: number | null;
  duration: number | null;
  percent: number | null;
  lastPosition: number | null;
  completedAt: Date | string | null;
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

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTopics = useCallback(async () => {
    try {
      const res = await fetch("/api/topics");
      if (res.ok) {
        const data = await res.json();
        setTopics(data);
      }
    } catch (err) {
      console.error("Failed to fetch topics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTopics();
    }
  }, [status, fetchTopics]);

  // Calculate overall progress
  const totalItems = topics.reduce((sum, t) => sum + t.items.length, 0);
  const completedItems = topics.reduce(
    (sum, t) =>
      sum +
      t.items.filter((item) => item.progress.some((p) => p.completed)).length,
    0
  );
  const overallPercent = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  const bookTopics = topics.filter((t) => t.kind === "BOOK");
  const courseTopics = topics.filter((t) => t.kind !== "BOOK");

  // Calculate speed and ETA
  const completedProgress = topics.flatMap((t) =>
    t.items.flatMap((item) =>
      item.progress.filter((p) => p.completed && p.completedAt)
    )
  );

  const completionDates = completedProgress
    .map((p) => new Date(p.completedAt!))
    .sort((a, b) => a.getTime() - b.getTime());

  let velocity = 0; // items per day
  let estimatedCompletionDate: Date | null = null;
  let daysRemaining = 0;

  if (completionDates.length > 0) {
    const now = new Date();
    const earliestDate = completionDates[0];
    const timeDiffMs = now.getTime() - earliestDate.getTime();
    const daysDiff = timeDiffMs / (1000 * 60 * 60 * 24);

    // Use a minimum baseline of 15 days to account for the initial batch completions (and seeded completions),
    // which scales up dynamically once your tracking history exceeds 15 days.
    const clampedDays = Math.max(15, daysDiff);
    velocity = completionDates.length / clampedDays;

    const remainingItems = totalItems - completedItems;
    if (velocity > 0 && remainingItems > 0) {
      daysRemaining = remainingItems / velocity;
      estimatedCompletionDate = new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[--color-accent-pink] border-t-transparent rounded-full animate-spin" />
          <p className="text-[--color-text-secondary] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        {/* 3D background elements */}
        <div className="bg-3d-container">
          <div className="cyber-grid"></div>
          <div className="glow-orb orb-pink" style={{ top: '-10%', left: '-10%' }} />
          <div className="glow-orb orb-chartreuse" style={{ bottom: '-10%', right: '-10%' }} />
          <div className="cube-3d" style={{ top: '20%', left: '15%' }}>
            <div className="face front"></div><div className="face back"></div><div className="face left"></div><div className="face right"></div><div className="face top"></div><div className="face bottom"></div>
          </div>
          <div className="cube-3d large" style={{ bottom: '20%', right: '15%' }}>
            <div className="face front"></div><div className="face back"></div><div className="face left"></div><div className="face right"></div><div className="face top"></div><div className="face bottom"></div>
          </div>
        </div>

        <div className="glass-card p-10 max-w-md w-full text-center relative z-10 border border-[--color-border-glass]">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[--color-accent-pink] to-[--color-accent-chartreuse] flex items-center justify-center shadow-lg shadow-pink-500/25">
              <svg className="w-8 h-8 text-[#05020a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold font-display gradient-text mb-2">Mission ML</h1>
            <p className="text-[--color-text-secondary] text-sm">
              Sign in to track your ML journey
            </p>
          </div>
          <button
            onClick={() => signIn("google")}
            className="btn-gradient w-full py-3 px-6 rounded-xl text-[#05020a] font-bold flex items-center justify-center gap-3 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* 3D background elements */}
      <div className="bg-3d-container">
        <div className="cyber-grid"></div>
        {/* Glow Blobs */}
        <div className="glow-orb orb-pink" style={{ top: '-10%', left: '-10%' }} />
        <div className="glow-orb orb-chartreuse" style={{ bottom: '-10%', right: '-10%' }} />
        <div className="glow-orb orb-purple" style={{ top: '35%', right: '-10%' }} />

        {/* 3D Cubes */}
        <div className="cube-3d" style={{ top: '12%', left: '8%' }}>
          <div className="face front"></div><div className="face back"></div><div className="face left"></div><div className="face right"></div><div className="face top"></div><div className="face bottom"></div>
        </div>
        <div className="cube-3d large" style={{ top: '55%', right: '6%' }}>
          <div className="face front"></div><div className="face back"></div><div className="face left"></div><div className="face right"></div><div className="face top"></div><div className="face bottom"></div>
        </div>
        <div className="cube-3d" style={{ bottom: '15%', left: '12%', width: '60px', height: '60px' }}>
          <div className="face front"></div><div className="face back"></div><div className="face left"></div><div className="face right"></div><div className="face top"></div><div className="face bottom"></div>
        </div>
        <div className="cube-3d" style={{ top: '30%', right: '82%', width: '70px', height: '70px' }}>
          <div className="face front"></div><div className="face back"></div><div className="face left"></div><div className="face right"></div><div className="face top"></div><div className="face bottom"></div>
        </div>

        {/* 3D Rings */}
        <div className="ring-3d" style={{ top: '25%', left: '78%', width: '180px', height: '180px' }}></div>
        <div className="ring-3d" style={{ top: '68%', left: '8%', width: '220px', height: '220px' }}></div>
        <div className="ring-3d" style={{ top: '45%', left: '20%', width: '120px', height: '120px' }}></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#05020a]/85 border-b border-[--color-border-glass]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[--color-accent-pink] to-[--color-accent-chartreuse] flex items-center justify-center shadow-md shadow-pink-500/20">
              <span className="text-[#05020a] font-black text-sm">ML</span>
            </div>
            <span className="font-bold font-display text-sm sm:text-base text-[--color-text-primary] tracking-tight">
              Mission ML
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/admin"
              className="text-xs font-semibold text-[--color-text-muted] hover:text-[--color-accent-chartreuse] transition-colors"
            >
              Admin Panel
            </a>
            <div className="flex items-center gap-2">
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt=""
                  className="w-7 h-7 rounded-full border border-pink-500/30"
                />
              )}
              <button
                onClick={() => signOut()}
                className="text-xs font-semibold text-[--color-text-muted] hover:text-[--color-accent-pink] transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-6 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-3 leading-tight tracking-tight font-display">
            <span className="gradient-text drop-shadow-[0_0_35px_rgba(236,43,122,0.15)]">Mission ML</span>
          </h1>
          <p className="text-base sm:text-lg text-[--color-text-secondary] mb-6 font-light">
            Kirtagya will be a Machine Learning Engineer in{" "}
            <span className="text-[--color-accent-chartreuse] font-bold tracking-wide drop-shadow-[0_0_10px_rgba(206,255,50,0.3)]">2027</span>
          </p>

          {/* Dynamic Reactor Core and Speed HUD Panel */}
          <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 max-w-3xl mx-auto">
            {/* Sci-Fi Reactor Core Progress Circle */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4 glass-card p-6 border border-[--color-border-glass] shadow-2xl relative min-h-[220px]">
              {/* Holographic scanner laser */}
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[--color-accent-chartreuse] to-transparent opacity-30 animate-pulse" />
              
              <div className="relative w-32 h-32">
                {/* Pulsing neon backing circle */}
                <div className="absolute inset-0 rounded-full border border-[--color-accent-pink]/5 animate-ping" />
                
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="rgba(236, 43, 122, 0.05)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${overallPercent * 3.267} ${326.7 - overallPercent * 3.267}`}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#EC2B7A" />
                      <stop offset="50%" stopColor="#FE7BBF" />
                      <stop offset="100%" stopColor="#CEFF32" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black font-display text-[--color-text-primary] tracking-tighter drop-shadow-[0_0_15px_rgba(236,43,122,0.4)]">
                    {Math.round(overallPercent)}%
                  </span>
                  <span className="text-[9px] text-[--color-text-muted] font-bold uppercase tracking-widest mt-0.5">
                    Complete
                  </span>
                </div>
              </div>
              <p className="text-xs text-[--color-text-secondary] font-mono">
                <span className="text-[--color-accent-chartreuse] font-bold">{completedItems}</span>
                <span className="text-[--color-text-muted] mx-1">/</span>
                <span className="font-semibold text-[--color-text-primary]">{totalItems}</span> items completed
              </p>
            </div>

            {/* Velocity Dynamics HUD */}
            <div className="flex-1 glass-card p-6 border border-[--color-border-glass] shadow-2xl relative flex flex-col justify-between text-left font-mono min-h-[220px]">
              {/* Holographic scanner laser */}
              <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[--color-accent-pink] to-transparent opacity-30 animate-pulse" />

              <div>
                <div className="flex items-center justify-between text-[10px] text-[--color-text-muted] font-bold uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
                  <span>⚡ System Dynamics</span>
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${velocity > 0 ? "bg-[--color-accent-chartreuse] animate-pulse" : "bg-[--color-accent-pink]"}`} />
                    {velocity > 0 ? "Analyzing" : "Awaiting Data"}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-[10px] text-[--color-text-muted] uppercase tracking-wider">Current Velocity</div>
                    <div className="text-xl sm:text-2xl font-black text-[--color-accent-chartreuse] mt-0.5 tracking-tight">
                      {velocity.toFixed(2)} <span className="text-xs font-normal text-[--color-text-secondary]">items / day</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-[--color-text-muted] uppercase tracking-wider">Estimated Time Left</div>
                    <div className="text-lg font-bold text-[--color-text-primary] mt-0.5">
                      {completedItems === totalItems && totalItems > 0 ? (
                        <span className="text-[--color-accent-chartreuse]">0 Days (Completed! 🎯)</span>
                      ) : velocity > 0 ? (
                        `${Math.ceil(daysRemaining)} Days`
                      ) : (
                        <span className="text-[--color-text-muted] text-xs">Need completions to calculate speed...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="text-[10px] text-[--color-text-muted] uppercase tracking-wider">ETA Target Lock</div>
                <div className="text-xs font-bold text-[--color-accent-pink] bg-[--color-accent-pink]/5 border border-[--color-accent-pink]/25 px-2.5 py-1 rounded-md">
                  {completedItems === totalItems && totalItems > 0 ? (
                    "COMPLETED"
                  ) : estimatedCompletionDate ? (
                    estimatedCompletionDate.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Structured Dashboard Sections */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 relative z-10 space-y-12">
        {loading ? (
          <div className="space-y-6">
            <div className="h-6 w-48 bg-white/5 rounded-md shimmer" />
            <div className="flex gap-6 overflow-x-auto pb-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-72 h-64 glass-card shimmer" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* AI Completion Forecast Predictor */}
            <AITimePredictor />

            {/* 1. Books section (Horizontal Stack) */}
            {bookTopics.length > 0 && (
              <section className="space-y-4" id="books-section">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-white/5 pb-3">
                  <h2 className="text-xl sm:text-2xl font-black font-display text-[--color-text-primary] tracking-tight flex items-center gap-2.5">
                    <span className="text-2xl">📖</span> Literature Trackers
                  </h2>
                  <p className="text-xs text-[--color-text-muted] font-medium">
                    Horizontal roadmap for course book reading milestones
                  </p>
                </div>
                <div className="flex flex-row gap-6 overflow-x-auto pb-6 pt-2 custom-scrollbar snap-x">
                  {bookTopics.map((topic) => (
                    <div key={topic.id} className="snap-start">
                      <TopicCard
                        topic={topic}
                        onProgressChange={fetchTopics}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 2. Course & Video Playlists (Horizontal Stack) */}
            {courseTopics.length > 0 && (
              <section className="space-y-4" id="playlists-section">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-white/5 pb-3">
                  <h2 className="text-xl sm:text-2xl font-black font-display text-[--color-text-primary] tracking-tight flex items-center gap-2.5">
                    <span className="text-2xl">⚡</span> Video & Course Playlists
                  </h2>
                  <p className="text-xs text-[--color-text-muted] font-medium">
                    Horizontal roadmap for video lectures and milestone trackers
                  </p>
                </div>
                <div className="flex flex-row gap-6 overflow-x-auto pb-6 pt-2 custom-scrollbar snap-x">
                  {courseTopics.map((topic) => (
                    <div key={topic.id} className="snap-start">
                      <TopicCard
                        topic={topic}
                        onProgressChange={fetchTopics}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Tracking disclaimer */}
        <footer className="mt-16 text-center">
          <p className="text-xs text-[--color-text-muted] flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-[--color-accent-pink]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Auto-tracking only counts time watched inside this app. Videos watched directly on YouTube won&apos;t be tracked.
          </p>
        </footer>
      </main>
    </div>
  );
}
