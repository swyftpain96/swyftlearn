import type { Language, SpokenLanguage, CodeLanguage } from '../types/index.ts';

export const LANGS: readonly Language[] = [
  {
    id: 'Español',
    kind: 'spoken',
    flag: '🇪🇸',
    tags: ['Native', 'Business', 'Conversational'],
  },
  {
    id: '日本語',
    kind: 'spoken',
    flag: '🇯🇵',
    tags: ['Keigo', 'Pitch Accent', 'Casual'],
  },
  {
    id: 'Serbian',
    kind: 'spoken',
    flag: '🇷🇸',
    tags: ['Grammar', 'Fluency', 'Immersion'],
  },
  {
    id: 'English',
    kind: 'spoken',
    flag: '🇬🇧',
    tags: ['Executive Articulation', 'Public Speaking'],
  },
  {
    id: 'JavaScript',
    kind: 'code',
    icon: '⚡',
    tags: ['Modern ES6+', 'React', 'Web Engines'],
  },
  {
    id: 'TypeScript',
    kind: 'code',
    icon: '📘',
    tags: ['Strict Typing', 'Generics', 'Architecture'],
  },
] as const;

export function getSpokenLanguages(): SpokenLanguage[] {
  return LANGS.filter((l): l is SpokenLanguage => l.kind === 'spoken');
}

export function getCodeLanguages(): CodeLanguage[] {
  return LANGS.filter((l): l is CodeLanguage => l.kind === 'code');
}
