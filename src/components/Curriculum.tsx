import React from 'react';
import { getSpokenLanguages, getCodeLanguages } from '../data/languages.ts';
import { LanguageCard } from './LanguageCard.tsx';

export function Curriculum() {
  const spokenLangs = getSpokenLanguages();
  const codeLangs = getCodeLanguages();

  return (
    <section id="curriculum" className="mx-auto max-w-6xl px-6 py-16 scroll-mt-12">
      <div className="max-w-2xl">
        <span className="inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-brand dark:bg-brand/20 dark:text-white">
          Curriculum Offerings
        </span>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink dark:text-white sm:text-4xl">
          Supported Languages
        </h2>
        <p className="mt-2 text-mute dark:text-white/70">
          Whether you are aiming for high-stakes business conversation or production-grade
          codebase architecture.
        </p>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        {/* Spoken Human Languages */}
        <LanguageCard
          categoryTitle="Human Languages"
          badgeText="Spoken Fluency"
          badgeVariant="brand"
          description="Conversational velocity, pitch accent, business nuance, and real-world immersion."
          items={spokenLangs}
          themeVariant="card-light"
        />

        {/* Programming Languages */}
        <LanguageCard
          categoryTitle="Programming Languages"
          badgeText="Code Mastery"
          badgeVariant="sun"
          description="Clean architecture, type safety, low-level concurrency, and production refactoring."
          items={codeLangs}
          themeVariant="card-dark"
        />
      </div>
    </section>
  );
}
