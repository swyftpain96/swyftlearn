import React from 'react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-ink/10 dark:border-white/10 py-8 text-center text-xs text-mute dark:text-white/60 transition-colors">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div>
          © {currentYear} SwyftPain — Live Mentorship for Spoken &amp; Programming Languages.
        </div>
        <div className="flex items-center gap-6">
          <a
            href="#curriculum"
            className="transition hover:text-brand dark:hover:text-sun"
          >
            Supported Languages
          </a>
          <a
            href="#book"
            className="transition hover:text-brand dark:hover:text-sun"
          >
            Book Intro Session
          </a>
        </div>
      </div>
    </footer>
  );
}
