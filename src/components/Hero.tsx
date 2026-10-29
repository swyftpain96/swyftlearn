import React from 'react';
import { Translator } from './Translator.tsx';

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-12 lg:py-20">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="inline-block rounded-full bg-brand/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-brand dark:bg-brand/20 dark:text-white">
            Direct 1-on-1 Mentorship
          </span>

          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-ink dark:text-white sm:text-6xl">
            Natural human fluency &amp; computational syntax.
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-mute dark:text-white/70">
            I mentor developers and professionals to speak both spoken languages and
            core programming frameworks with native clarity, architectural rigor, and speed.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#book"
              className="cursor-pointer rounded-full bg-brand px-7 py-3.5 text-base font-medium text-white shadow-md transition hover:bg-[#2b2ed8] active:scale-95"
            >
              Schedule Intro Chat
            </a>
            <a
              href="#curriculum"
              className="cursor-pointer text-sm font-medium underline underline-offset-4 text-ink hover:text-brand dark:text-white dark:hover:text-sun transition"
            >
              View Supported Languages
            </a>
          </div>
        </div>

        <div>
          <Translator />
        </div>
      </div>
    </section>
  );
}
