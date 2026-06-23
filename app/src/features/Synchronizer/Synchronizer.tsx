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
  FileJson,
  X,
  ListX,
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

const EXCLUDED_PROGRESS_TAGS = [
  '#INTRO',
  '#VERSE',
  '#CHORUS',
  '#PRE-CHORUS',
  '#HOOK',
  '#BRIDGE',
  '#OUTRO',
];

/** Structure tags that are non-syncable dividers (excludes #INSTRUMENTAL which IS syncable) */
const NON_SYNCABLE_TAGS = [
  '#INTRO',
  '#VERSE',
  '#CHORUS',
  '#PRE-CHORUS',
  '#HOOK',
  '#BRIDGE',
  '#OUTRO',
];

export default function Synchronizer() {
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    updateLyricTimestamp,
    clearLyricTimestampsFromIndex,
    audioFiles,
    setAudioFile,
    updateProject,
  } = useAppStore();
  const project = projects.find((p) => p.id === activeProjectId);

  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [inputYoutubeUrl, setInputYoutubeUrl] = useState('');

  const showToast = useToastStore((state) => state.showToast);

  const isLineSyncable = (lineIndex: number) => {
    if (!project || lineIndex < 0 || lineIndex >= project.lyrics.length)
      return false;
    const line = project.lyrics[lineIndex];
    if (line.id === 'start-marker' || line.id === 'end-marker') return false;
    const trimmedUpper = line.text.trim().toUpperCase();
    return !NON_SYNCABLE_TAGS.includes(trimmedUpper);
  };

  const isLineSyncableOrEndMarker = (lineIndex: number) => {
    if (!project || lineIndex < 0 || lineIndex >= project.lyrics.length)
      return false;
    const line = project.lyrics[lineIndex];
    if (line.id === 'end-marker') return true;
    return isLineSyncable(lineIndex);
  };

  const isLineUnsynced = (lineIndex: number) => {
    if (!project || lineIndex < 0 || lineIndex >= project.lyrics.length)
      return false;
    const line = project.lyrics[lineIndex];
    if (line.id === 'start-marker' || line.id === 'end-marker') return false;
    const textUpper = line.text.trim().toUpperCase();
    if (NON_SYNCABLE_TAGS.includes(textUpper)) return false;
    if (EXCLUDED_PROGRESS_TAGS.includes(textUpper)) return false;
    return line.timestamp === null;
  };

  const {
    isReady,
    isPlaying,
    currentTime,
    duration,
    loadAudio,
    loadYouTube,
    togglePlayPause,
    seekTo,
  } = useAudioEngine({
    onEnded: () => {
      if (project) {
        const hasUnsyncedLines = project.lyrics.some(
          (line, index) => isLineSyncable(index) && line.timestamp === null,
        );
        if (hasUnsyncedLines) {
          showToast(
            'Audio ended but there are unsynced lines left.',
            'warning',
          );
        }
      }
    },
    onTimeUpdate: (newTime: number) => {
      if (!project || !isPlaying) return;

      let newActiveIndex = -1;

      for (let i = 0; i < project.lyrics.length; i++) {
        if (!isLineSyncableOrEndMarker(i)) continue;
        const t = project.lyrics[i].timestamp;
        if (t !== null && t <= newTime) {
          newActiveIndex = i;
        } else if (t !== null && t > newTime) {
          break;
        }
      }

      if (newActiveIndex !== -1 && newActiveIndex !== activeLineIndex) {
        setActiveLineIndex(newActiveIndex);
      }
    },
  });

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    seekTo(newTime);

    if (project) {
      let newActiveIndex = 0;
      for (let i = 0; i < project.lyrics.length; i++) {
        if (!isLineSyncableOrEndMarker(i)) continue;
        const t = project.lyrics[i].timestamp;
        if (t !== null && t <= newTime) {
          newActiveIndex = i;
        } else if (t !== null && t > newTime) {
          break;
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
    }
    setActiveLineIndex(index);
  };

  const getYoutubeId = (url: string | undefined): string | null => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };
  const youtubeId = getYoutubeId(project?.youtubeUrl);

  const lastLoadedSourceRef = useRef<string | null>(null);

  useEffect(() => {
    if (project) {
      if (youtubeId) {
        if (lastLoadedSourceRef.current !== youtubeId) {
          lastLoadedSourceRef.current = youtubeId;
          loadYouTube(youtubeId);
        }
      } else if (audioFiles[project.id]) {
        const file = audioFiles[project.id];
        const fileKey = `${file.name}-${file.size}`;
        if (lastLoadedSourceRef.current !== fileKey) {
          lastLoadedSourceRef.current = fileKey;
          loadAudio(file);
        }
      }
    }
  }, [project, youtubeId, audioFiles, loadAudio, loadYouTube]);

  const handleSaveInlineEdit = (index: number) => {
    if (!project) return;
    const trimmed = editingText.trim();
    if (!trimmed) {
      showToast('Lyric line cannot be empty.', 'error');
      return;
    }
    const updatedLyrics = [...project.lyrics];
    updatedLyrics[index] = { ...updatedLyrics[index], text: trimmed };
    updateProject(project.id, { lyrics: updatedLyrics });
    setEditingLineId(null);
    showToast('Lyric text updated!', 'success');
  };

  const handleYoutubeSubmit = () => {
    if (!project) return;
    const url = inputYoutubeUrl.trim();
    if (!url) {
      showToast('Please enter a YouTube URL.', 'error');
      return;
    }
    const id = getYoutubeId(url);
    if (!id) {
      showToast('Invalid YouTube URL format.', 'error');
      return;
    }
    updateProject(project.id, { youtubeUrl: url });
    showToast('YouTube URL loaded successfully!', 'success');
  };

  const handleFileSelect = (file: File) => {
    if (activeProjectId) {
      setAudioFile(activeProjectId, file);
    }
    loadAudio(file);
  };

  const lyricListRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  const handleArrowDown = () => {
    if (!project || activeLineIndex >= project.lyrics.length) return;
    const currentLine = project.lyrics[activeLineIndex];
    if (currentLine.id === 'end-marker') return;

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
      let minTimestamp = 0;
      for (let i = nextIndex - 1; i >= 0; i--) {
        if (isLineSyncable(i)) {
          const prevTimestamp = project.lyrics[i].timestamp;
          if (prevTimestamp !== null) {
            minTimestamp = prevTimestamp + 0.01;
          }
          break;
        }
      }
      const lockedTime = Math.max(currentTime, minTimestamp);
      updateLyricTimestamp(project.id, nextIndex, lockedTime);
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
      if (isLineSyncable(prevIndex)) {
        updateLyricTimestamp(project.id, prevIndex, null);
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
      const newTimestamp = Math.max(0, currentTimestamp - 0.1);
      updateLyricTimestamp(project.id, targetIndex, newTimestamp);
      seekTo(newTimestamp);
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
      const newTimestamp = currentTimestamp + 0.1;
      updateLyricTimestamp(project.id, targetIndex, newTimestamp);
      seekTo(newTimestamp);
    }
  };

  useKeyboardShortcuts({
    onArrowDown: handleArrowDown,
    onArrowUp: handleArrowUp,
    onArrowLeft: handleArrowLeft,
    onArrowRight: handleArrowRight,
    isActive: isReady && !isHelpOpen && !isEditModalOpen && !isExportMenuOpen,
  });

  const handleExport = (format: 'srt' | 'txt' | 'lirius') => {
    if (!project) return;

    if (format === 'srt') {
      const hasUnsyncedLines = project.lyrics.some(
        (line, index) => isLineSyncable(index) && line.timestamp === null,
      );
      if (hasUnsyncedLines) {
        showToast(
          'Warning: Some lyric lines have not been synchronized yet.',
          'warning',
        );
      }
    }

    let content: string;
    let type: string;

    if (format === 'lirius') {
      content = JSON.stringify(project, null, 2);
      type = 'application/json';
    } else {
      content =
        format === 'srt'
          ? generateSrt(project.lyrics, duration)
          : generateTxt(project.lyrics);
      type = 'text/plain';
    }

    const blob = new Blob([content], { type });
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

  useEffect(() => {
    if (activeLineRef.current && lyricListRef.current) {
      const activeEl = activeLineRef.current;
      const containerEl = lyricListRef.current;
      
      const activeRect = activeEl.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();
      
      const isBelowViewport = activeRect.bottom > containerRect.bottom;
      const isAboveViewport = activeRect.top < containerRect.top;
      
      if (isBelowViewport || isAboveViewport) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      } else {
        const activeBottomRelative = activeRect.bottom - containerRect.top;
        const threshold = containerRect.height * 0.7;
        if (activeBottomRelative > threshold) {
          const scrollAmount = activeBottomRelative - threshold;
          containerEl.scrollBy({
            top: scrollAmount,
            behavior: 'smooth',
          });
        }
      }
    }
  }, [activeLineIndex]);

  if (!project) return null;

  return (
    <div className="flex flex-col h-full absolute inset-0 bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-200 dark:selection:bg-blue-900 overflow-hidden">
      {/* Header - Sticky */}
      <header className="sticky top-0 inset-x-0 flex items-center p-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-20 transition-all shrink-0">
        <button
          onClick={() => setActiveProjectId(null)}
          className="mr-4 p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm hover:shadow hover:-translate-x-0.5 border border-slate-200 dark:border-slate-700 transition-all"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>
        <div className="flex-1 overflow-hidden">
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight truncate drop-shadow-sm">
            {project.name}
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
            {project.lyrics.length} lines total
          </p>
        </div>
        {(isReady || !!youtubeId) && (
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm hover:shadow border border-slate-200 dark:border-slate-700 transition-all group"
              title="Edit Lyrics"
            >
              <Edit3 className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 transition-colors" />
            </button>
            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm hover:shadow border border-slate-200 dark:border-slate-700 transition-all group hidden sm:flex"
              title="Help"
            >
              <HelpCircle className="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 transition-colors" />
            </button>
            <div className="relative">
              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full transition-transform hover:scale-105 active:scale-95 font-bold shadow-lg shadow-blue-500/30"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="w-4 h-4 ml-0.5 opacity-70" />
              </button>

              {isExportMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsExportMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-20 overflow-hidden transform origin-top-right transition-all">
                    <div className="py-2" role="menu">
                      <button
                        onClick={() => handleExport('srt')}
                        className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-4 transition-colors group"
                      >
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                          <FileAudio className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            .SRT Format
                          </div>
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            With timings, no tags
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleExport('txt')}
                        className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-4 transition-colors group border-t border-slate-100 dark:border-slate-700/50"
                      >
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            .TXT Format
                          </div>
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            With tags, no timings
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleExport('lirius')}
                        className="w-full text-left px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-4 transition-colors group border-t border-slate-100 dark:border-slate-700/50"
                      >
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                          <FileJson className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            .LIRIUS Format
                          </div>
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                            Project backup
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
      <main className={`flex-1 relative flex flex-col py-6 ${!(isReady || youtubeId) ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        {/* Background gradient effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-blue-500/10 dark:bg-blue-600/10 blur-3xl pointer-events-none rounded-full" />

        {!(isReady || youtubeId) ? (
          <div className="flex-1 flex items-center justify-center p-6 z-10">
            <div className="max-w-4xl w-full bg-white dark:bg-slate-800 p-6 md:p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 transform rotate-3">
                  <FileAudio className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
                  Load Audio Source
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-lg mx-auto font-medium">
                  Provide a local FLAC audio file or a YouTube link to sync lyrics for{' '}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {project.name}
                  </strong>
                  .
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                {/* Option A: Local Audio */}
                <div className="flex flex-col space-y-4">
                  <h3 className="text-left text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Option A: Local Audio
                  </h3>
                  <AudioInput onFileSelect={handleFileSelect} />
                </div>

                {/* Option B: YouTube URL */}
                <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700 pt-6 md:pt-0 md:pl-8">
                  <div className="space-y-4">
                    <h3 className="text-left text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Option B: YouTube URL
                    </h3>
                    <p className="text-left text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Sync lyrics directly with a YouTube video. Provide the video URL below to stream and synchronize timing in real-time.
                    </p>
                  </div>
                  <div className="space-y-3 mt-6 md:mt-0 text-left">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                      YouTube URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputYoutubeUrl}
                        onChange={(e) => setInputYoutubeUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white transition-all"
                      />
                      <button
                        onClick={handleYoutubeSubmit}
                        className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all shrink-0"
                      >
                        Load
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`flex-1 flex w-full max-w-7xl mx-auto overflow-hidden ${youtubeId ? 'flex-col lg:flex-row gap-6 px-4 md:px-8' : 'flex-col'}`}>
            {youtubeId && (
              <div className="w-full lg:w-96 xl:w-[480px] shrink-0 z-20 mb-6 lg:mb-0">
                <div className="sticky top-0 aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-700/50 bg-black">
                  {!isReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white z-10">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <span className="text-sm text-slate-400">
                          Loading YouTube Player...
                        </span>
                      </div>
                    </div>
                  )}
                  <div
                    id="youtube-player-container"
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}

            <div
              ref={lyricListRef}
              className="flex-1 overflow-y-auto px-4 scroll-smooth hide-scrollbar z-10"
              style={{ paddingBottom: '30vh', paddingTop: '2vh' }}
            >
              <div className="max-w-2xl mx-auto space-y-2 w-full">
                {project.lyrics.map((line, index) => {
                  const isActive = index === activeLineIndex;
                  const isStructureTag = VALID_STRUCTURE_TAGS.includes(
                    line.text.trim().toUpperCase(),
                  );
                  const isInstrumental =
                    line.text.trim().toUpperCase() === '#INSTRUMENTAL';

                  if (isStructureTag && !isInstrumental) {
                    return (
                      <div
                        key={line.id}
                        ref={isActive ? activeLineRef : null}
                        className={`w-full px-4 py-2.5 rounded-xl border border-dashed text-center font-mono text-xs uppercase tracking-widest transition-all ${
                          isActive
                            ? 'border-blue-500 dark:border-blue-400 bg-blue-50/20 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                            : 'border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {line.text.replace(/^#/, '')}
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
                      onDoubleClick={(e) => {
                        if (
                          line.id !== 'start-marker' &&
                          line.id !== 'end-marker' &&
                          !isStructureTag
                        ) {
                          e.stopPropagation();
                          setEditingLineId(line.id);
                          setEditingText(line.text);
                        }
                      }}
                      className={`group w-full rounded-xl border p-4 transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-950/20 shadow-md scale-[1.01]'
                          : isPast
                            ? 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 opacity-70 hover:opacity-100'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'
                      }`}
                    >
                      {editingLineId === line.id ? (
                        <div
                          className="py-1 w-full max-w-xl mx-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onBlur={() => handleSaveInlineEdit(index)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveInlineEdit(index);
                              } else if (e.key === 'Escape') {
                                setEditingLineId(null);
                              }
                            }}
                            className="w-full px-4 py-2 text-center text-lg font-bold bg-white dark:bg-slate-800 border-2 border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white shadow-sm"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {isLineUnsynced(index) && (
                              <span
                                className="w-2.5 h-2.5 rounded-full bg-amber-500 dark:bg-amber-400 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                                title="Unsynchronized line"
                              />
                            )}
                            <span
                              className={`font-bold transition-colors truncate ${
                                isActive
                                  ? 'text-base md:text-lg text-blue-600 dark:text-blue-400'
                                  : isPast
                                    ? 'text-sm md:text-base text-slate-400 dark:text-slate-600'
                                    : 'text-sm md:text-base text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {isInstrumental ? '🎵 INSTRUMENTAL 🎵' : line.text}
                            </span>
                          </div>

                          {hasTimestamp && (
                            <span className="shrink-0 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              {formatTime(line.timestamp as number)}
                            </span>
                          )}
                        </div>
                      )}

                      {isActive &&
                        hasTimestamp &&
                        line.id !== 'start-marker' &&
                        line.id !== 'end-marker' &&
                        (!isStructureTag || isInstrumental) && (
                          <div
                            className="flex flex-col items-center mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 w-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateLyricTimestamp(
                                    project.id,
                                    index,
                                    null,
                                  )
                                }
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-wider font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-full transition-all shadow-sm"
                              >
                                <X className="w-3.5 h-3.5" /> Clear
                              </button>
                              <button
                                onClick={() =>
                                  clearLyricTimestampsFromIndex(
                                    project.id,
                                    index,
                                  )
                                }
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] uppercase tracking-wider font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-full transition-all shadow-sm"
                              >
                                <ListX className="w-3.5 h-3.5" /> Clear
                                Below
                              </button>
                            </div>
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Player */}
      {(isReady || youtubeId) && (
        <footer className="sticky bottom-0 inset-x-0 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] p-3 md:py-3.5 md:px-6 z-30 shrink-0">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 w-full">
            {/* Left section: Play/Pause & Time */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={togglePlayPause}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md shrink-0 border border-blue-400/20"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>
              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
                {formatTime(currentTime)} <span className="text-slate-400 dark:text-slate-600">/</span> {formatTime(duration)}
              </span>
            </div>

            {/* Middle section: Sync Navigation controls (slimmer) */}
            <div className="flex bg-slate-100 dark:bg-slate-900/50 p-0.5 rounded-xl shrink-0">
              <button
                onClick={handleArrowLeft}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all"
                title="Nudge Backward (-0.1s)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleArrowUp}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all"
                title="Previous Line"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={handleArrowDown}
                className="px-5 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 shadow-sm transition-all mx-1 flex items-center gap-1"
                title="Sync Line (Down)"
              >
                <ChevronDown className="w-4 h-4" /> SYNC
              </button>
              <button
                onClick={handleArrowRight}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all"
                title="Nudge Forward (+0.1s)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right section: Progress bar & Line Counter */}
            <div className="flex-1 flex items-center gap-4 w-full md:w-auto">
              {/* Progress Slider */}
              <div className="flex-1 relative group flex items-center h-4 cursor-pointer min-w-[120px]">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.01}
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute z-20 w-full opacity-0 cursor-pointer"
                />
                <div className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${(currentTime / Math.max(duration, 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Position Counter */}
              <span className="shrink-0 text-xs font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                {activeLineIndex + 1}/{project.lyrics.length}
              </span>
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
