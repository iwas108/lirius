import { describe, it, expect } from 'vitest';
import { parseLyrics } from './lyricParser';

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
