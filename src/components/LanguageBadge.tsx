import React from 'react';

export interface LanguageBadgeProps {
  label: string;
  variant?: 'light' | 'dark' | 'brand';
  className?: string;
}

export function LanguageBadge({
  label,
  variant = 'light',
  className = '',
}: LanguageBadgeProps) {
  let style = 'bg-white text-mute border border-ink/5 dark:bg-white/10 dark:text-white/80 dark:border-white/10';

  if (variant === 'dark') {
    style = 'bg-white/10 text-white/80 font-mono border border-white/5';
  } else if (variant === 'brand') {
    style = 'bg-brand/10 text-brand border border-brand/20 dark:bg-brand/20 dark:text-white';
  }

  return (
    <span
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${style} ${className}`}
    >
      {label}
    </span>
  );
}
