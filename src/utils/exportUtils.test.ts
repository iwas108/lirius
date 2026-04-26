import { describe, it, expect } from 'vitest';
import { formatTimeSrt, generateSrt, generateTxt } from './exportUtils';
import type { LyricLine } from '../types';

describe('exportUtils', () => {
  describe('formatTimeSrt', () => {
    it('should format zero correctly', () => {
      expect(formatTimeSrt(0)).toBe('00:00:00,000');
    });

    it('should format seconds and milliseconds', () => {
      expect(formatTimeSrt(1.234)).toBe('00:00:01,234');
      expect(formatTimeSrt(45.678)).toBe('00:00:45,678');
    });

    it('should format minutes correctly', () => {
      expect(formatTimeSrt(65.432)).toBe('00:01:05,432');
      expect(formatTimeSrt(125.0)).toBe('00:02:05,000');
    });

    it('should format hours correctly', () => {
      expect(formatTimeSrt(3600)).toBe('01:00:00,000');
      expect(formatTimeSrt(3665.432)).toBe('01:01:05,432');
    });
  });

  describe('generateSrt', () => {
    it('should generate empty string for empty lyrics', () => {
      expect(generateSrt([], 100)).toBe('');
    });

    it('should skip unsynced lines', () => {
      const lyrics: LyricLine[] = [
        { id: '1', text: 'Line 1', timestamp: null },
        { id: '2', text: 'Line 2', timestamp: null },
      ];
      expect(generateSrt(lyrics, 100)).toBe('');
    });

    it('should generate correct srt for fully synced lines', () => {
      const lyrics: LyricLine[] = [
        { id: '1', text: 'First line', timestamp: 1.0 },
        { id: '2', text: 'Second line', timestamp: 3.5 },
        { id: '3', text: 'Third line', timestamp: 5.0 },
      ];

      const expectedSrt = `1
00:00:01,000 --> 00:00:03,499
First line

2
00:00:03,500 --> 00:00:04,999
Second line

3
00:00:05,000 --> 00:00:10,000
Third line`;

      expect(generateSrt(lyrics, 10)).toBe(expectedSrt);
    });

    it('should calculate last line duration if audio is shorter than last timestamp', () => {
      const lyrics: LyricLine[] = [
        { id: '1', text: 'First line', timestamp: 5.0 },
      ];

      // If audio duration (4.0) is smaller than timestamp (5.0), it should default to +2s
      const expectedSrt = `1
00:00:05,000 --> 00:00:07,000
First line`;

      expect(generateSrt(lyrics, 4)).toBe(expectedSrt);
    });

    it('should omit structure tags', () => {
      const lyrics: LyricLine[] = [
        { id: '1', text: '#CHORUS', timestamp: 1.0 },
        { id: '2', text: 'First line', timestamp: 3.0 },
      ];

      // Audio duration is 5.0, so the last line should end at 5.0
      const expectedSrt = `1
00:00:03,000 --> 00:00:05,000
First line`;

      expect(generateSrt(lyrics, 5)).toBe(expectedSrt);
    });

    it('should omit un-fixed loose structure tags', () => {
      const lyrics: LyricLine[] = [
        { id: '1', text: '[Chorus]', timestamp: 1.0 },
        { id: '2', text: 'First line', timestamp: 3.0 },
        { id: '3', text: 'intro', timestamp: 4.0 },
        { id: '4', text: 'Second line', timestamp: 5.0 },
      ];

      // It should skip lines 1 and 3
      const expectedSrt = `1
00:00:03,000 --> 00:00:04,999
First line

2
00:00:05,000 --> 00:00:07,000
Second line`;

      expect(generateSrt(lyrics, 7)).toBe(expectedSrt);
    });
  });

  describe('generateTxt', () => {
    it('should generate empty string for empty lyrics', () => {
      expect(generateTxt([])).toBe('');
    });

    it('should include structure tags and omit timings', () => {
      const lyrics: LyricLine[] = [
        { id: '1', text: '#CHORUS', timestamp: 1.0 },
        { id: '2', text: 'First line', timestamp: 3.0 },
      ];

      const expectedTxt = `#CHORUS\nFirst line`;

      expect(generateTxt(lyrics)).toBe(expectedTxt);
    });
  });
});
