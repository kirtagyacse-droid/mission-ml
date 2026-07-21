"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* 3D background elements */}
      <div className="bg-3d-container">
        <div className="cyber-grid"></div>
        <div className="cube-3d" style={{ top: '15%', left: '15%' }}>
          <div className="face front"></div><div className="face back"></div><div className="face left"></div><div className="face right"></div><div className="face top"></div><div className="face bottom"></div>
        </div>
        <div className="cube-3d large" style={{ bottom: '15%', right: '15%' }}>
          <div className="face front"></div><div className="face back"></div><div className="face left"></div><div className="face right"></div><div className="face top"></div><div className="face bottom"></div>
        </div>
      </div>

      <div className="glass-card p-10 max-w-md w-full text-center relative z-10 border border-[--color-border-glass]">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[--color-accent-pink] to-[--color-accent-chartreuse] flex items-center justify-center shadow-lg shadow-pink-500/25">
            <svg
              className="w-10 h-10 text-[#05020a]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-black gradient-text mb-2 tracking-tight">Mission ML</h1>
          <p className="text-[--color-text-secondary] font-light">
            Kirtagya will be a Machine Learning Engineer in <span className="text-[--color-accent-chartreuse] font-bold">2027</span>
          </p>
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="btn-gradient w-full py-3.5 px-6 rounded-xl text-[#05020a] font-bold flex items-center justify-center gap-3 text-base cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>

        <p className="mt-6 text-xs text-[--color-text-muted] font-medium">
          This is a personal app. Only authorized users can sign in.
        </p>
      </div>
    </div>
  );
}
