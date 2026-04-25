import type { LyricLine } from '../types';

/**
 * Formats a time in seconds into the standard SRT format (HH:MM:SS,mmm)
 * @param seconds Time in seconds
 * @returns Formatted SRT timestamp string
 */
export function formatTimeSrt(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor(Math.round(seconds * 1000) % 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds
    .toString()
    .padStart(3, '0')}`;
}

/**
 * Generates the contents of a .srt file from an array of LyricLines.
 * The end time of line N is calculated as slightly before the start time of line N+1.
 * @param lyrics Array of synchronized LyricLines
 * @param audioDuration Duration of the audio file in seconds, used for the last line's end time
 * @returns The generated SRT file content as a string
 */
export function generateSrt(
  lyrics: LyricLine[],
  audioDuration: number,
): string {
  let srtContent = '';

  // Filter out empty lines or lines with no text just in case, but rely mostly on the parser.
  const validLyrics = lyrics.filter((line) => line.text.trim() !== '');

  let sequenceIndex = 1;

  for (let i = 0; i < validLyrics.length; i++) {
    const currentLine = validLyrics[i];

    // Only process synced lines
    if (currentLine.timestamp === null) {
      continue;
    }

    const startTime = currentLine.timestamp;
    let endTime: number;

    // Find the next synced line to determine end time
    let nextSyncedIndex = i + 1;
    while (
      nextSyncedIndex < validLyrics.length &&
      validLyrics[nextSyncedIndex].timestamp === null
    ) {
      nextSyncedIndex++;
    }

    if (nextSyncedIndex < validLyrics.length) {
      // Calculate end time as 1ms before the start of the next line
      endTime = (validLyrics[nextSyncedIndex].timestamp as number) - 0.001;
      // Ensure end time is not less than start time (just a safety check)
      if (endTime <= startTime) {
        endTime = startTime + 0.1; // fallback to +100ms
      }
    } else {
      // For the last synced line, use the audio duration or add 2 seconds if not provided
      endTime = audioDuration > startTime ? audioDuration : startTime + 2.0;
    }

    const startStr = formatTimeSrt(startTime);
    const endStr = formatTimeSrt(endTime);

    srtContent += `${sequenceIndex}\n`;
    srtContent += `${startStr} --> ${endStr}\n`;
    srtContent += `${currentLine.text}\n\n`;

    sequenceIndex++;
  }

  return srtContent.trim();
}
