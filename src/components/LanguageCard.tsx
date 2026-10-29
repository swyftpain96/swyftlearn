import React from 'react';
import type { Language } from '../types/index.ts';
import { LanguageBadge } from './LanguageBadge.tsx';

export interface LanguageCardProps {
  categoryTitle: string;
  badgeText: string;
  badgeVariant?: 'brand' | 'sun';
  description: string;
  items: readonly Language[];
  themeVariant?: 'card-light' | 'card-dark';
  className?: string;
}

export function LanguageCard({
  categoryTitle,
  badgeText,
  badgeVariant = 'brand',
  description,
  items,
  themeVariant = 'card-light',
  className = '',
}: LanguageCardProps) {
  const isDarkVariant = themeVariant === 'card-dark';

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 transition-colors ${
        isDarkVariant
          ? 'bg-ink text-white border border-white/10 shadow-lg'
          : 'bg-white text-ink border border-ink/10 dark:bg-ink/70 dark:text-white dark:border-white/10 shadow-sm'
      } ${className}`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`text-xs font-bold uppercase tracking-wider ${
            badgeVariant === 'sun' ? 'text-sun' : 'text-brand dark:text-brand'
          }`}
        >
          {badgeText}
        </span>
      </div>
      <h3 className="mt-1 text-2xl font-bold">{categoryTitle}</h3>
      <p
        className={`mt-2 text-sm ${
          isDarkVariant ? 'text-white/70' : 'text-mute dark:text-white/60'
        }`}
      >
        {description}
      </p>

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex flex-col gap-2 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between transition ${
              isDarkVariant
                ? 'bg-white/5 hover:bg-white/10'
                : 'bg-paper/70 hover:bg-paper dark:bg-white/5 dark:hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl" role="img" aria-label={item.id}>
                {item.kind === 'spoken' ? item.flag : item.icon}
              </span>
              <span
                className={`font-semibold ${
                  item.kind === 'code' ? 'font-mono text-sun' : 'text-ink dark:text-white'
                }`}
              >
                {item.id}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <LanguageBadge
                  key={tag}
                  label={tag}
                  variant={isDarkVariant ? 'dark' : 'light'}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
