import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Play, Pause, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import AudioInput from '../../components/AudioInput';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

export default function Synchronizer() {
  const { projects, activeProjectId, setActiveProjectId, updateLyricTimestamp } = useAppStore();
  const project = projects.find((p) => p.id === activeProjectId);

  const [activeLineIndex, setActiveLineIndex] = useState(0);

  const { isReady, isPlaying, currentTime, loadAudio, togglePlayPause, pause } =
    useAudioEngine({
      onEnded: () => {
        if (project && activeLineIndex < project.lyrics.length) {
          alert('Audio ended but there are unsynced lines left.');
        }
      },
      onTimeUpdate: () => {
        // Find the active line based on timestamp if needed, or allow keyboard sync
        // For now we'll stick to the manual sync as per the spec for shortcuts
        // which we will build in step 15-16.
        // But we will highlight the current line if it has a timestamp.
      },
    });

  const lyricListRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Keyboard Shortcuts Logic
  const handleArrowDown = () => {
    if (!project || activeLineIndex >= project.lyrics.length) return;

    // Determine the minimum allowed timestamp (previous line's timestamp + 10ms)
    let minTimestamp = 0;
    if (activeLineIndex > 0) {
      const prevTimestamp = project.lyrics[activeLineIndex - 1].timestamp;
      if (prevTimestamp !== null) {
        minTimestamp = prevTimestamp + 0.01; // 10ms
      }
    }

    const lockedTime = Math.max(currentTime, minTimestamp);
    updateLyricTimestamp(project.id, activeLineIndex, lockedTime);
    setActiveLineIndex((prev) => Math.min(prev + 1, project.lyrics.length - 1));
  };

  const handleArrowUp = () => {
    if (!project || activeLineIndex <= 0) return;
    const prevIndex = activeLineIndex - 1;
    updateLyricTimestamp(project.id, prevIndex, null);
    setActiveLineIndex(prevIndex);
  };

  const handleArrowLeft = () => {
    if (!project) return;
    // Nudge the most recently locked line (which is activeLineIndex - 1, or activeLineIndex if we want to allow tweaking the active line if it has a timestamp)
    // The instructions say: "Nudge the timestamp of the currently selected/locked line"
    // Usually the user just locked a line and moved to the next, so they want to nudge the previous one,
    // OR they are currently on a line that already has a timestamp.
    // Let's modify the line at `activeLineIndex - 1` if the current line doesn't have a timestamp,
    // or the current line if it does.
    let targetIndex = activeLineIndex;
    if (project.lyrics[activeLineIndex].timestamp === null && activeLineIndex > 0) {
      targetIndex = activeLineIndex - 1;
    }

    const currentTimestamp = project.lyrics[targetIndex].timestamp;
    if (currentTimestamp !== null) {
      updateLyricTimestamp(project.id, targetIndex, Math.max(0, currentTimestamp - 0.1));
    }
  };

  const handleArrowRight = () => {
    if (!project) return;
    let targetIndex = activeLineIndex;
    if (project.lyrics[activeLineIndex].timestamp === null && activeLineIndex > 0) {
      targetIndex = activeLineIndex - 1;
    }

    const currentTimestamp = project.lyrics[targetIndex].timestamp;
    if (currentTimestamp !== null) {
      updateLyricTimestamp(project.id, targetIndex, currentTimestamp + 0.1);
    }
  };

  useKeyboardShortcuts({
    onArrowDown: handleArrowDown,
    onArrowUp: handleArrowUp,
    onArrowLeft: handleArrowLeft,
    onArrowRight: handleArrowRight,
    isActive: isReady,
  });

  // Smooth scroll active line into view
  useEffect(() => {
    if (activeLineRef.current && lyricListRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex]);

  if (!project) return null;

  return (
    <div className="flex flex-col h-full absolute inset-0 bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="flex items-center p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10 shrink-0">
        <button
          onClick={() => setActiveProjectId(null)}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {project.name}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {project.lyrics.length} lines total
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        {!isReady ? (
          <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-xl w-full text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                Load Audio File
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                To resume syncing this project, please re-select the original
                .flac audio file.
              </p>
              <AudioInput onFileSelect={loadAudio} />
            </div>
          </div>
        ) : (
          <div
            ref={lyricListRef}
            className="flex-1 overflow-y-auto px-4 py-32 md:px-12 scroll-smooth"
          >
            <div className="max-w-3xl mx-auto space-y-8">
              {project.lyrics.map((line, index) => {
                const isActive = index === activeLineIndex;
                const isPast = index < activeLineIndex;

                return (
                  <div
                    key={line.id}
                    ref={isActive ? activeLineRef : null}
                    className={`transition-all duration-300 transform text-center px-4 ${
                      isActive
                        ? 'text-3xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 scale-100 opacity-100 py-4'
                        : isPast
                          ? 'text-xl md:text-2xl font-medium text-gray-400 dark:text-gray-600 scale-95 opacity-50'
                          : 'text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-200 scale-95 opacity-80'
                    }`}
                  >
                    {line.text}
                    {line.timestamp !== null && (
                      <div className="text-xs font-mono opacity-50 mt-2 text-gray-500">
                        {formatTime(line.timestamp)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Bar Controls */}
      {isReady && (
        <footer className="shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 md:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.2)] z-10">
          {/* Mobile Touch Controls */}
          <div className="md:hidden flex justify-center gap-4 mb-4">
            <button
              onClick={handleArrowUp}
              className="p-3 bg-gray-200 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 active:bg-gray-300 dark:active:bg-gray-700"
              aria-label="Previous Line (Up)"
            >
              <ChevronUp className="w-6 h-6" />
            </button>
            <button
              onClick={handleArrowDown}
              className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 active:bg-blue-200 dark:active:bg-blue-900/50 flex-1 flex justify-center"
              aria-label="Next Line (Down)"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleArrowLeft}
                className="p-3 bg-gray-200 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 active:bg-gray-300 dark:active:bg-gray-700"
                aria-label="Nudge backward (Left)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleArrowRight}
                className="p-3 bg-gray-200 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 active:bg-gray-300 dark:active:bg-gray-700"
                aria-label="Nudge forward (Right)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="font-mono text-xl text-gray-700 dark:text-gray-300 w-24">
              {formatTime(currentTime)}
            </div>

            <button
              onClick={togglePlayPause}
              className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-500/50"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-1" />
              )}
            </button>

            <div className="w-24 text-right text-sm text-gray-500 dark:text-gray-400">
              Line {activeLineIndex + 1}/{project.lyrics.length}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

// Simple time formatter for the UI
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}
