import { describe, it, expect } from 'vitest';
import { parseLyrics, validateLyrics, autoFixLyrics } from './lyricParser';

describe('parseLyrics', () => {
  it('should return an empty array for empty input', () => {
    expect(parseLyrics('')).toEqual([]);
    expect(parseLyrics('   ')).toEqual([]);
    expect(parseLyrics('\n\n\n')).toEqual([]);
  });

  it('should parse simple lines correctly', () => {
    const input = 'Line 1\nLine 2\nLine 3';
    const result = parseLyrics(input);

    expect(result).toHaveLength(3);
    expect(result[0].text).toBe('Line 1');
    expect(result[0].timestamp).toBeNull();
    expect(result[0].id).toBeDefined();

    expect(result[1].text).toBe('Line 2');
    expect(result[2].text).toBe('Line 3');
  });

  it('should trim whitespace and ignore empty lines', () => {
    const input = '  Line 1  \n\n  \nLine 2\n \t \nLine 3\n';
    const result = parseLyrics(input);

    expect(result).toHaveLength(3);
    expect(result[0].text).toBe('Line 1');
    expect(result[1].text).toBe('Line 2');
    expect(result[2].text).toBe('Line 3');
  });

  it('should generate unique IDs for each line', () => {
    const input = 'Line 1\nLine 2';
    const result = parseLyrics(input);

    expect(result[0].id).not.toBe(result[1].id);
  });
});

describe('validateLyrics', () => {
  it('should return empty array for valid lyrics', () => {
    const input = '#VERSE\nHello world\nThis is a test';
    expect(validateLyrics(input)).toEqual([]);
  });

  it('should flag uncapitalized lines', () => {
    const input = 'hello world';
    const warnings = validateLyrics(input);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain('capital letter');
  });

  it('should flag end-line punctuation', () => {
    const input = 'Hello world.';
    const warnings = validateLyrics(input);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain('punctuation');
  });

  it('should flag malformed tags', () => {
    const invalidInput = '#INVALIDTAG';
    const invalidWarnings = validateLyrics(invalidInput);
    expect(invalidWarnings).toHaveLength(1);
    expect(invalidWarnings[0].message).toContain('structure tag');
  });

  it('should flag slang', () => {
    const input = 'I wanna hold your hand';
    const warnings = validateLyrics(input);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].message).toContain('slang');
  });
});

describe('autoFixLyrics', () => {
  it('should capitalize first letters', () => {
    const input = 'hello world\nhow are you';
    const result = autoFixLyrics(input);
    expect(result).toBe('Hello world\nHow are you');
  });

  it('should remove end-line punctuation', () => {
    const input2 = 'Hello world.\nHow are you,';
    const result = autoFixLyrics(input2);
    expect(result).toBe('Hello world\nHow are you');
  });

  it('should fix structure tags', () => {
    const input = '[verse]\n#chorus\nintro';
    const result = autoFixLyrics(input);
    expect(result).toBe('#VERSE\n#CHORUS\n#INTRO');
  });

  it('should strip symbols from malformed tags', () => {
    const input = '[invalid]';
    const result = autoFixLyrics(input);
    // It strips [ ] and capitalizes I
    expect(result).toBe('Invalid');
  });
});
