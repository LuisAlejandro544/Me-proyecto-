// @ts-nocheck
// Compilador: tipos y sanitize (extraído de ui/compile.ts — ver barrel ui/compile.ts).
export type CompileFormat = 'html' | 'vnjson' | 'windows' | 'linux';

export interface StoryIssue {
  level: 'error' | 'aviso';
  msg: string;
}

/** Nombre de archivo seguro a partir del título del proyecto. */
export function sanitizeFileStem(name: string, fallback = 'Mi_Novela'): string {
  const clean = (name ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 48);
  return clean || fallback;
}
