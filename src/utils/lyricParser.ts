import type { LyricLine } from '../types';

/**
 * Parses plain text lyrics into an array of LyricLine objects.
 * Splits by newline, trims whitespace, and filters out empty lines.
 *
 * @param {string} text - The raw text lyrics to parse.
 * @returns {LyricLine[]} An array of structured LyricLine objects.
 */
export function parseLyrics(text: string): LyricLine[] {
  if (!text) return [];

  const lines = text.split('\n');
  const result: LyricLine[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      result.push({
        id: crypto.randomUUID(),
        text: trimmed,
        timestamp: null,
      });
    }
  }

  return result;
}
