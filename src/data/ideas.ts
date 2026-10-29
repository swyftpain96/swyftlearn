import type { LangIdeas } from '../types/index.ts';

export const IDEAS: readonly LangIdeas[] = [
  {
    label: 'Greet the world',
    en: 'Hello, world.',
    out: {
      Español: 'Hola, mundo.',
      日本語: 'こんにちは、世界。',
      Serbian: 'Zdravo, svete.',
      English: 'Hello, world.',
      JavaScript: 'console.log("Hello, world");',
      TypeScript: 'const msg: string = "Hello, world";\nconsole.log(msg);',
    },
  },
  {
    label: 'Repeat it',
    en: 'Do it three times.',
    out: {
      Español: 'Hazlo tres veces.',
      日本語: '三回やってみよう。',
      Serbian: 'Uradi tri puta.',
      English: 'Do it three times.',
      JavaScript: 'for (let i = 0; i < 3; i++) {\n  practice();\n}',
      TypeScript: 'Array.from({ length: 3 }).forEach(() => practice());',
    },
  },
  {
    label: 'Decide',
    en: 'If it rains, take an umbrella.',
    out: {
      Español: 'Si llueve, lleva paraguas.',
      日本語: '雨なら、傘を持って行こう。',
      Serbian: 'Ako pada kiša, nosi kišobran.',
      English: 'If it rains, take an umbrella.',
      JavaScript: 'if (raining) {\n  take(umbrella);\n}',
      TypeScript: 'if (isRaining) {\n  take(umbrella);\n}',
    },
  },
] as const;
