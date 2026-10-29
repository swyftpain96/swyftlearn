import React, { useState, useEffect } from 'react';
import { LANGS } from '../data/languages.ts';
import { IDEAS } from '../data/ideas.ts';
import type { Language } from '../types/index.ts';

export function Translator() {
  const [ideaIndex, setIdeaIndex] = useState<number>(0);
  const [langIndex, setLangIndex] = useState<number>(0);
  const [autoPlay, setAutoPlay] = useState<boolean>(true);

  // Auto-cycle through languages
  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setLangIndex((prev) => (prev + 1) % LANGS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [autoPlay]);

  const currentLang: Language = LANGS[langIndex] ?? LANGS[0];
  const currentIdea = IDEAS[ideaIndex] ?? IDEAS[0];
  const fullText: string =
    currentIdea.out[currentLang.id as keyof typeof currentIdea.out] || '';
  const isCode = currentLang.kind === 'code';

  // Typing effect
  const [typed, setTyped] = useState<string>(fullText);
  useEffect(() => {
    let charIndex = 0;
    setTyped('');
    const timer = setInterval(() => {
      charIndex++;
      setTyped(fullText.slice(0, charIndex));
      if (charIndex >= fullText.length) {
        clearInterval(timer);
      }
    }, 22);
    return () => clearInterval(timer);
  }, [fullText]);

  return (
    <div className="rounded-3xl bg-ink p-6 text-white shadow-2xl shadow-brand/20 sm:p-8 border border-white/10">
      {/* Interactive Tabs */}
      <div className="flex flex-wrap gap-2">
        {IDEAS.map((item, idx) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              setIdeaIndex(idx);
              setAutoPlay(false);
            }}
            className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition ${
              idx === ideaIndex
                ? 'bg-white text-ink shadow-sm'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-white/50">
        In Plain English:{' '}
        <span className="normal-case text-white/90 font-normal">
          {currentIdea.en}
        </span>
      </p>

      {/* Code / Translation Display Box */}
      <div className="mt-4 flex min-h-[140px] items-start rounded-2xl bg-black/40 p-5 font-mono border border-white/10">
        <pre
          className={`whitespace-pre-wrap break-words ${
            isCode ? 'text-lg text-sun' : 'text-2xl text-white font-sans'
          }`}
        >
          {typed}
          <span className="ml-1 inline-block h-[1em] w-0.5 animate-pulse bg-current align-middle" />
        </pre>
      </div>

      {/* Language Pills */}
      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5">
        {LANGS.map((lang, idx) => (
          <button
            key={lang.id}
            type="button"
            onClick={() => {
              setLangIndex(idx);
              setAutoPlay(false);
            }}
            className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
              idx === langIndex
                ? 'bg-brand text-white ring-2 ring-sun'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            }`}
          >
            {lang.kind === 'spoken' ? lang.flag : lang.icon} {lang.id}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setAutoPlay((prev) => !prev)}
          className="cursor-pointer ml-auto text-xs text-white/60 underline underline-offset-4 hover:text-white"
        >
          {autoPlay ? 'Pause autoplay' : 'Resume autoplay'}
        </button>
      </div>
    </div>
  );
}
