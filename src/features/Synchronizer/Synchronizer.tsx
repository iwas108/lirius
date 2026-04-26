import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Download,
  HelpCircle,
  Edit3,
  FileText,
  FileAudio,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import AudioInput from '../../components/AudioInput';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { generateSrt, generateTxt } from '../../utils/exportUtils';
import { VALID_STRUCTURE_TAGS } from '../../utils/lyricParser';
import HelpModal from './HelpModal';
import CreateProjectModal from '../Dashboard/CreateProjectModal';
import { useToastStore } from '../../store/useToastStore';

export default function Synchronizer() {
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    updateLyricTimestamp,
    audioFiles,
    setAudioFile,
  } = useAppStore();
  const project = projects.find((p) => p.id === activeProjectId);

  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  const showToast = useToastStore((state) => state.showToast);

  const {
    isReady,
    isPlaying,
    currentTime,
    duration,
    loadAudio,
    togglePlayPause,
    seekTo,
  } = useAudioEngine({
    onEnded: () => {
      if (project && activeLineIndex < project.lyrics.length) {
        showToast('Audio ended but there are unsynced lines left.', 'warning');
      }
    },
    onTimeUpdate: () => {
      // When seeking, update the active line index to the nearest matched timestamp
      // We only do this if it's a significant jump (e.g., from seek bar)
      // For smooth playback, we let manual sync control the active line
      // But let's implement the requirement: "Clicking the seek bar updates the active lyric to the nearest matching timestamp"
    },
  });

  const isLineSyncable = (lineIndex: number) => {
    if (!project || lineIndex < 0 || lineIndex >= project.lyrics.length)
      return false;
    const line = project.lyrics[lineIndex];
    if (line.id === 'start-marker' || line.id === 'end-marker') return false;
    const trimmedUpper = line.text.trim().toUpperCase();
    return !VALID_STRUCTURE_TAGS.includes(trimmedUpper);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    seekTo(newTime);

    if (project) {
      // Find the last lyric line with a timestamp <= newTime
      let newActiveIndex = 0; // Default to start-marker

      for (let i = 0; i < project.lyrics.length; i++) {
        if (!isLineSyncable(i)) continue;
        const t = project.lyrics[i].timestamp;
        if (t !== null && t <= newTime) {
          newActiveIndex = i;
        } else if (t !== null && t > newTime) {
          break; // Since timestamps are ordered, we can break early
        }
      }
      setActiveLineIndex(newActiveIndex);
    }
  };

  const handleLyricClick = (index: number) => {
    if (!project || !isLineSyncable(index)) return;
    const timestamp = project.lyrics[index].timestamp;
    if (timestamp !== null) {
      seekTo(timestamp);
      setActiveLineIndex(index);
    }
  };

  useEffect(() => {
    if (!isReady && activeProjectId && audioFiles[activeProjectId]) {
      loadAudio(audioFiles[activeProjectId]);
    }
  }, [activeProjectId, audioFiles, isReady, loadAudio]);

  const handleFileSelect = (file: File) => {
    if (activeProjectId) {
      setAudioFile(activeProjectId, file);
    }
    loadAudio(file);
  };

  const lyricListRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Keyboard Shortcuts Logic
  const handleArrowDown = () => {
    if (!project || activeLineIndex >= project.lyrics.length) return;

    const currentLine = project.lyrics[activeLineIndex];
    if (currentLine.id === 'end-marker') return;

    if (currentLine.id === 'start-marker') {
      // Find the first syncable line and jump to it without setting a timestamp
      let nextIndex = activeLineIndex + 1;
      while (nextIndex < project.lyrics.length && !isLineSyncable(nextIndex)) {
        nextIndex++;
      }
      if (nextIndex < project.lyrics.length) {
        setActiveLineIndex(nextIndex);
      }
      return;
    }

    if (!isLineSyncable(activeLineIndex)) return;

    // Determine the minimum allowed timestamp (previous line's timestamp + 10ms)
    let minTimestamp = 0;

    // Find the previous syncable line
    for (let i = activeLineIndex - 1; i >= 0; i--) {
      if (isLineSyncable(i)) {
        const prevTimestamp = project.lyrics[i].timestamp;
        if (prevTimestamp !== null) {
          minTimestamp = prevTimestamp + 0.01; // 10ms
        }
        break;
      }
    }

    const lockedTime = Math.max(currentTime, minTimestamp);
    updateLyricTimestamp(project.id, activeLineIndex, lockedTime);

    // Find next syncable index or the end marker
    let nextIndex = activeLineIndex + 1;
    while (nextIndex < project.lyrics.length) {
      if (
        isLineSyncable(nextIndex) ||
        project.lyrics[nextIndex].id === 'end-marker'
      ) {
        break;
      }
      nextIndex++;
    }

    if (nextIndex < project.lyrics.length) {
      setActiveLineIndex(nextIndex);
    }
  };

  const handleArrowUp = () => {
    if (!project || activeLineIndex <= 0) return;

    let prevIndex = activeLineIndex - 1;
    while (prevIndex >= 0) {
      if (
        isLineSyncable(prevIndex) ||
        project.lyrics[prevIndex].id === 'start-marker'
      ) {
        break;
      }
      prevIndex--;
    }

    if (prevIndex >= 0) {
      // If we go back to a syncable line, clear its timestamp
      if (isLineSyncable(prevIndex)) {
        updateLyricTimestamp(project.id, prevIndex, null);
      } else if (project.lyrics[activeLineIndex].id === 'end-marker') {
        // If we were at end marker, and moved back, activeLineIndex was end-marker
        // we move to the last syncable line which is prevIndex, and we should clear it
        // Wait, if prevIndex is a syncable line, it's cleared above.
        // If we move back from the FIRST syncable line, prevIndex is start-marker.
        // We just move to it, start-marker has no timestamp to clear.
      }

      setActiveLineIndex(prevIndex);
    }
  };

  const handleArrowLeft = () => {
    if (!project) return;

    let targetIndex = activeLineIndex;
    if (
      project.lyrics[activeLineIndex].timestamp === null ||
      !isLineSyncable(activeLineIndex)
    ) {
      let prevIndex = activeLineIndex - 1;
      while (prevIndex >= 0 && !isLineSyncable(prevIndex)) {
        prevIndex--;
      }
      if (prevIndex >= 0) {
        targetIndex = prevIndex;
      }
    }

    const currentTimestamp = project.lyrics[targetIndex].timestamp;
    if (currentTimestamp !== null && isLineSyncable(targetIndex)) {
      updateLyricTimestamp(
        project.id,
        targetIndex,
        Math.max(0, currentTimestamp - 0.1),
      );
    }
  };

  const handleArrowRight = () => {
    if (!project) return;
    let targetIndex = activeLineIndex;
    if (
      project.lyrics[activeLineIndex].timestamp === null ||
      !isLineSyncable(activeLineIndex)
    ) {
      let prevIndex = activeLineIndex - 1;
      while (prevIndex >= 0 && !isLineSyncable(prevIndex)) {
        prevIndex--;
      }
      if (prevIndex >= 0) {
        targetIndex = prevIndex;
      }
    }

    const currentTimestamp = project.lyrics[targetIndex].timestamp;
    if (currentTimestamp !== null && isLineSyncable(targetIndex)) {
      updateLyricTimestamp(project.id, targetIndex, currentTimestamp + 0.1);
    }
  };

  useKeyboardShortcuts({
    onArrowDown: handleArrowDown,
    onArrowUp: handleArrowUp,
    onArrowLeft: handleArrowLeft,
    onArrowRight: handleArrowRight,
    isActive: isReady && !isHelpOpen && !isEditModalOpen && !isExportMenuOpen,
  });

  const handleExport = (format: 'srt' | 'txt') => {
    if (!project) return;

    if (format === 'srt') {
      const hasUnsyncedLines = project.lyrics.some(
        (line, index) => isLineSyncable(index) && line.timestamp === null,
      );
      if (hasUnsyncedLines) {
        showToast(
          'Warning: Some lyric lines have not been synchronized yet. They will not be included in the SRT export.',
          'warning',
        );
      }
    }

    const content =
      format === 'srt'
        ? generateSrt(project.lyrics, duration)
        : generateTxt(project.lyrics);

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name || 'lirius-export'}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };

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
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {project.name}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {project.lyrics.length} lines total
          </p>
        </div>
        {isReady && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
              aria-label="Edit Lyrics"
              title="Edit Lyrics"
            >
              <Edit3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
              aria-label="Help"
              title="Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                aria-haspopup="true"
                aria-expanded={isExportMenuOpen}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </button>

              {isExportMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsExportMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20 overflow-hidden">
                    <div
                      className="py-1"
                      role="menu"
                      aria-orientation="vertical"
                    >
                      <button
                        onClick={() => handleExport('srt')}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
                        role="menuitem"
                      >
                        <FileAudio className="w-4 h-4 text-blue-500" />
                        <div>
                          <div className="font-medium">Export as .SRT</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            With timings, no tags
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleExport('txt')}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 border-t border-gray-100 dark:border-gray-700"
                        role="menuitem"
                      >
                        <FileText className="w-4 h-4 text-blue-500" />
                        <div>
                          <div className="font-medium">Export as .TXT</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            With tags, no timings
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
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
              <AudioInput onFileSelect={handleFileSelect} />
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
                const isStructureTag = VALID_STRUCTURE_TAGS.includes(
                  line.text.trim().toUpperCase(),
                );

                if (isStructureTag) {
                  return (
                    <div
                      key={line.id}
                      ref={isActive ? activeLineRef : null}
                      className="flex items-center justify-center my-8"
                    >
                      <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1 max-w-[100px]"></div>
                      <span className="px-4 text-xs font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400">
                        {line.text.replace(/^#/, '')}
                      </span>
                      <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1 max-w-[100px]"></div>
                    </div>
                  );
                }

                const isPast = index < activeLineIndex;
                const hasTimestamp = line.timestamp !== null;

                return (
                  <div
                    key={line.id}
                    ref={isActive ? activeLineRef : null}
                    onClick={() => handleLyricClick(index)}
                    className={`transition-all duration-300 transform text-center px-4 ${hasTimestamp ? 'cursor-pointer hover:opacity-80' : ''} ${
                      isActive
                        ? 'text-3xl md:text-5xl font-bold text-blue-600 dark:text-blue-400 scale-100 opacity-100 py-4'
                        : isPast
                          ? 'text-xl md:text-2xl font-medium text-gray-400 dark:text-gray-600 scale-95 opacity-50'
                          : 'text-xl md:text-2xl font-medium text-gray-800 dark:text-gray-200 scale-95 opacity-80'
                    }`}
                  >
                    {line.text}
                    {hasTimestamp && (
                      <div className="text-xs font-mono opacity-50 mt-2 text-gray-500">
                        {formatTime(line.timestamp as number)}
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
          {/* Touch Controls (Mobile & Desktop) */}
          <div className="flex justify-center gap-4 mb-4">
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

          <div className="max-w-4xl mx-auto flex flex-col gap-4">
            {/* Seek Bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-gray-500 w-12 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.01}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
                aria-label="Seek time"
              />
              <span className="text-xs font-mono text-gray-500 w-12">
                {formatTime(duration)}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-4">
              <div className="font-mono text-xl text-gray-700 dark:text-gray-300 w-24">
                {formatTime(currentTime)}
              </div>

              <button
                onClick={togglePlayPause}
                className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-500/50 shrink-0"
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
          </div>
        </footer>
      )}

      {/* Modals */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      {project && (
        <CreateProjectModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          editProjectId={project.id}
        />
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
