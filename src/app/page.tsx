"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import TopicCard from "@/components/TopicCard";

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

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-[--color-text-secondary] text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-10 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold gradient-text mb-2">Mission ML</h1>
            <p className="text-[--color-text-secondary] text-sm">
              Sign in to track your ML journey
            </p>
          </div>
          <button
            onClick={() => signIn("google")}
            className="btn-gradient w-full py-3 px-6 rounded-xl text-white font-medium flex items-center justify-center gap-3"
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[--color-bg-primary]/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">ML</span>
            </div>
            <span className="font-semibold text-sm sm:text-base text-[--color-text-primary]">
              Mission ML
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/admin"
              className="text-xs text-[--color-text-muted] hover:text-[--color-accent-cyan] transition-colors"
            >
              Admin
            </a>
            <div className="flex items-center gap-2">
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt=""
                  className="w-7 h-7 rounded-full border border-white/10"
                />
              )}
              <button
                onClick={() => signOut()}
                className="text-xs text-[--color-text-muted] hover:text-[--color-accent-red] transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 leading-tight">
            <span className="gradient-text">Mission ML</span>
          </h1>
          <p className="text-lg sm:text-xl text-[--color-text-secondary] mb-6">
            Kirtagya will be a Machine Learning Engineer in{" "}
            <span className="text-[--color-accent-amber] font-semibold">2027</span>
          </p>

          {/* Overall Progress Ring */}
          <div className="inline-flex flex-col items-center gap-3">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
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
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-[--color-text-primary] count-animate">
                  {Math.round(overallPercent)}%
                </span>
                <span className="text-[10px] text-[--color-text-muted] uppercase tracking-wider">
                  Complete
                </span>
              </div>
            </div>
            <p className="text-sm text-[--color-text-secondary]">
              <span className="text-[--color-accent-green] font-semibold">{completedItems}</span>
              {" / "}
              <span className="font-semibold">{totalItems}</span> items completed
            </p>
          </div>
        </div>
      </section>

      {/* Topics List */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-6 shimmer h-24" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {topics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                onProgressChange={fetchTopics}
              />
            ))}
          </div>
        )}

        {/* Tracking disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[--color-text-muted] flex items-center justify-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Auto-tracking only counts time watched inside this app. Videos watched directly on YouTube won&apos;t be tracked.
          </p>
        </div>
      </section>
    </div>
  );
}
