"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    AccessDenied: "Access denied. Only authorized users can sign in to this app.",
    Configuration: "Server configuration error. Please check your environment variables.",
    default: "An authentication error occurred. Please try again.",
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-500/20 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-[--color-accent-red]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[--color-text-primary] mb-2">
          Authentication Error
        </h1>
        <p className="text-[--color-text-secondary] mb-6">
          {errorMessages[error ?? "default"] ?? errorMessages.default}
        </p>
        <Link
          href="/auth/signin"
          className="btn-gradient inline-block py-2.5 px-6 rounded-xl text-white font-medium"
        >
          Try Again
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ErrorContent />
    </Suspense>
  );
}
