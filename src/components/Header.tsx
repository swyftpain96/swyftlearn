import React from 'react';
import { DarkModeToggle } from './DarkModeToggle.tsx';

export function Header() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 transition-colors">
      <a
        href="#"
        className="text-2xl font-bold tracking-tight text-ink dark:text-white"
      >
        Swyft<span className="text-brand">Pain</span>
      </a>

      {/* Actions */}
      <div className="flex items-center gap-4 sm:gap-6">
        <nav className="hidden items-center gap-6 sm:flex">
          <a
            href="#curriculum"
            className="text-sm font-medium text-mute transition hover:text-ink dark:text-white/70 dark:hover:text-white"
          >
            Curriculum
          </a>
        </nav>

        {/* Dark Mode Switcher */}
        <DarkModeToggle />

        <a
          href="#book"
          className="rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand dark:bg-white dark:text-ink dark:hover:bg-sun"
        >
          Book Intro Session
        </a>
      </div>
    </header>
  );
}
