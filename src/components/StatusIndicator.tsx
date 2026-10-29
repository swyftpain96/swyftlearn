import React from 'react';
import type { InquiryState } from '../types/index.ts';

export interface StatusIndicatorProps {
  state: InquiryState;
  onReset?: () => void;
  className?: string;
}

export function StatusIndicator({
  state,
  onReset,
  className = '',
}: StatusIndicatorProps) {
  if (state.status === 'idle') {
    return null;
  }

  if (state.status === 'loading') {
    return (
      <div
        className={`flex items-center gap-3 rounded-2xl border border-brand/20 bg-brand/5 p-6 text-ink dark:text-white dark:bg-brand/10 dark:border-brand/30 animate-pulse ${className}`}
        role="status"
        aria-live="polite"
      >
        <svg
          className="h-6 w-6 animate-spin text-brand dark:text-sun"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
        <div>
          <p className="font-semibold text-sm">Sending your inquiry...</p>
          <p className="text-xs text-mute dark:text-white/60">
            Please wait a moment while your details are processed.
          </p>
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div
        className={`rounded-2xl border border-red-500/30 bg-red-50 p-6 text-red-900 dark:bg-red-950/40 dark:border-red-500/50 dark:text-red-200 ${className}`}
        role="alert"
      >
        <div className="flex items-start gap-3">
          <svg
            className="h-6 w-6 shrink-0 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 7.5h.008v.008H12v-.008Z"
            />
          </svg>
          <div className="flex-1">
            <h4 className="font-bold text-sm">Submission Error</h4>
            <p className="mt-1 text-sm">{state.message}</p>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="cursor-pointer mt-4 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
              >
                <span>Edit &amp; Try Again</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Success State
  const { message, inquiryId, details } = state;

  return (
    <div
      className={`flex flex-col justify-center rounded-2xl bg-paper p-8 text-center dark:bg-white/5 dark:border dark:border-white/10 ${className}`}
      role="status"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      </div>

      <h3 className="mt-4 text-2xl font-bold text-ink dark:text-white">
        Message sent, {details.name}!
      </h3>

      <p className="mt-2 text-sm text-mute dark:text-white/70">
        {message}
      </p>

      <div className="mt-4 inline-block font-mono text-xs text-mute dark:text-white/50">
        Reference ID: {inquiryId}
      </div>

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="cursor-pointer mx-auto mt-6 text-sm font-semibold text-brand dark:text-sun underline"
        >
          Submit another inquiry
        </button>
      )}
    </div>
  );
}
