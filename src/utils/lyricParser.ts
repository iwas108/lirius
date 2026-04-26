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

  // Add dummy Start marker
  result.push({
    id: 'start-marker',
    text: 'Start',
    timestamp: null,
  });

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      const isInstrumental = trimmed.match(/^\[?#?instrumental\]?$/i);

      if (isInstrumental) {
        result.push({
          id: crypto.randomUUID(),
          text: '#INSTRUMENTAL',
          timestamp: null,
        });

        // Check if the next non-empty line is already '🎵'
        let hasMusicNoteNext = false;
        for (let j = i + 1; j < lines.length; j++) {
          const nextTrimmed = lines[j].trim();
          if (nextTrimmed.length > 0) {
            if (nextTrimmed === '🎵') {
              hasMusicNoteNext = true;
            }
            break;
          }
        }

        if (!hasMusicNoteNext) {
          result.push({
            id: crypto.randomUUID(),
            text: '🎵',
            timestamp: null,
          });
        }
      } else {
        result.push({
          id: crypto.randomUUID(),
          text: trimmed,
          timestamp: null,
        });
      }
    }
  }

  // Add dummy End marker
  result.push({
    id: 'end-marker',
    text: 'End of Lyric',
    timestamp: null,
  });

  return result;
}

export const VALID_STRUCTURE_TAGS = [
  '#INTRO',
  '#VERSE',
  '#CHORUS',
  '#PRE-CHORUS',
  '#HOOK',
  '#BRIDGE',
  '#OUTRO',
  '#INSTRUMENTAL',
];

export interface ValidationWarning {
  line: number;
  message: string;
}

/**
 * Validates lyrics according to basic Musixmatch guidelines.
 * Flags capitalization, end-line punctuation, slang, and malformed tags.
 *
 * @param {string} text - The raw lyrics text.
 * @returns {ValidationWarning[]} Array of warnings.
 */
export function validateLyrics(text: string): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const lines = text.split('\n');

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const isTagLike =
      trimmed.startsWith('#') ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'));

    if (isTagLike) {
      const normalizedTag = trimmed
        .toUpperCase()
        .replace(/^\[|\]$/g, '')
        .replace(/^#/, '#');
      if (
        !VALID_STRUCTURE_TAGS.includes(normalizedTag) &&
        !VALID_STRUCTURE_TAGS.includes('#' + normalizedTag)
      ) {
        warnings.push({
          line: index + 1,
          message: 'Malformed or unsupported structure tag.',
        });
      }
    } else {
      const firstChar = trimmed.charAt(0);
      if (firstChar !== firstChar.toUpperCase() && firstChar.match(/[a-z]/i)) {
        warnings.push({
          line: index + 1,
          message: 'Line should start with a capital letter.',
        });
      }

      if (trimmed.match(/[.,;:]$/)) {
        warnings.push({
          line: index + 1,
          message: 'Remove end-line punctuation.',
        });
      }

      if (trimmed.toLowerCase().match(/\b(wanna|gonna|gotta|cause|'cause)\b/)) {
        warnings.push({
          line: index + 1,
          message:
            'Review slang words (wanna, gonna, etc.). Ensure they match audio.',
        });
      }
    }
  });

  return warnings;
}

/**
 * Automatically fixes common lyric formatting issues.
 * Corrects tags, removes end-line punctuation, and capitalizes first letters.
 *
 * @param {string} text - The raw lyrics text.
 * @returns {string} The cleaned up lyrics text.
 */
export function autoFixLyrics(text: string): string {
  const lines = text.split('\n');
  const fixedLines = lines.map((line) => {
    let trimmed = line.trim();
    if (!trimmed) return '';

    // Check for structure tags
    const tagMatch = trimmed.match(
      /^\[?#?(intro|verse|chorus|pre-chorus|hook|bridge|outro|instrumental)\]?$/i,
    );
    if (tagMatch) {
      return `#${tagMatch[1].toUpperCase()}`;
    }

    // Clean up malformed tags by stripping symbols
    if (
      trimmed.startsWith('#') ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      trimmed = trimmed
        .replace(/^#/, '')
        .replace(/^\[|\]$/g, '')
        .trim();
      if (!trimmed) return '';
    }

    // Remove end-line punctuation
    trimmed = trimmed.replace(/[.,;:]+$/, '');

    // Capitalize first letter
    if (trimmed.length > 0) {
      trimmed = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    }

    return trimmed;
  });

  // Filter out any lines that became empty after cleanup, to avoid consecutive empty lines if needed,
  // but preserving intentional paragraph breaks is usually good.
  // For plain text lyrics, we can keep the empty lines to demarcate sections, or filter them out.
  // The parseLyrics drops empty lines anyway, so keeping them in text is fine.
  return fixedLines.join('\n');
}
