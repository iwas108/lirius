import { useState, useEffect, useRef } from 'react';
import {
  X,
  AlertTriangle,
  Upload,
  FileJson,
  Plus,
  PlusCircle,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useToastStore } from '../../store/useToastStore';
import {
  validateLyrics,
  VALID_STRUCTURE_TAGS,
  parseSRT,
} from '../../utils/lyricParser';
import type { LyricLine } from '../../types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  editProjectId?: string;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  editProjectId,
}: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [lines, setLines] = useState<LyricLine[]>([
    { id: crypto.randomUUID(), text: '', timestamp: null },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const liriusInputRef = useRef<HTMLInputElement>(null);

  const { projects, createProject, updateProject } = useAppStore();
  const { showToast } = useToastStore();

  const prevIsOpenRef = useRef(isOpen);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      if (editProjectId) {
        const project = projects.find((p) => p.id === editProjectId);
        if (project) {
          setProjectName(project.name);
          setYoutubeUrl(project.youtubeUrl || '');
          // Filter out start/end markers for editing
          const editableLines = project.lyrics.filter(
            (l) => l.id !== 'start-marker' && l.id !== 'end-marker',
          );
          setLines(
            editableLines.length > 0
              ? editableLines
              : [{ id: crypto.randomUUID(), text: '', timestamp: null }],
          );
        }
      } else {
        setProjectName('');
        setYoutubeUrl('');
        setLines([{ id: crypto.randomUUID(), text: '', timestamp: null }]);
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, editProjectId, projects]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!isOpen) return null;

  const handleTextChange = (index: number, text: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], text };
    setLines(newLines);
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData('text');
    const pastedLines = pasteText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (pastedLines.length === 0) return;

    const newLines = [...lines];
    // Replace current line text
    newLines[index] = { ...newLines[index], text: pastedLines[0] };

    // Insert the rest
    const additionalLines = pastedLines.slice(1).map((text) => ({
      id: crypto.randomUUID(),
      text,
      timestamp: null,
    }));

    newLines.splice(index + 1, 0, ...additionalLines);
    setLines(newLines);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newLines = [...lines];
      newLines.splice(index + 1, 0, {
        id: crypto.randomUUID(),
        text: '',
        timestamp: null,
      });
      setLines(newLines);
      // Focus will be handled by autoFocus on new inputs or a ref list if we add one.
      // For simplicity here, we let the user tab to it or click.
      setTimeout(() => {
        const inputs = document.querySelectorAll('.lyric-line-input');
        if (inputs[index + 1]) {
          (inputs[index + 1] as HTMLInputElement).focus();
        }
      }, 0);
    } else if (
      e.key === 'Backspace' &&
      lines[index].text === '' &&
      lines.length > 1
    ) {
      e.preventDefault();
      const newLines = [...lines];
      newLines.splice(index, 1);
      setLines(newLines);
      setTimeout(() => {
        const inputs = document.querySelectorAll('.lyric-line-input');
        if (inputs[index - 1]) {
          (inputs[index - 1] as HTMLInputElement).focus();
        } else if (inputs[index]) {
          (inputs[index] as HTMLInputElement).focus();
        }
      }, 0);
    }
  };

  const addLine = (index: number) => {
    const newLines = [...lines];
    newLines.splice(index + 1, 0, {
      id: crypto.randomUUID(),
      text: '',
      timestamp: null,
    });
    setLines(newLines);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    const newLines = [...lines];
    newLines.splice(index, 1);
    setLines(newLines);
  };

  const insertTag = (tag: string) => {
    const newLines = [...lines];
    // Add tag at the bottom
    newLines.push({ id: crypto.randomUUID(), text: tag, timestamp: null });
    setLines(newLines);
    setTimeout(() => {
      const inputs = document.querySelectorAll('.lyric-line-input');
      if (inputs.length > 0) {
        (inputs[inputs.length - 1] as HTMLInputElement).focus();
      }
    }, 0);
  };

  const insertInstrumentalBlock = () => {
    const newLines = [...lines];
    newLines.push({
      id: crypto.randomUUID(),
      text: '#INSTRUMENTAL',
      timestamp: null,
    });
    newLines.push({ id: crypto.randomUUID(), text: '🎵', timestamp: null });
    setLines(newLines);
    setTimeout(() => {
      const container = document.getElementById('modal-scroll-container');
      if (container) container.scrollTop = container.scrollHeight;
    }, 0);
  };

  const handleSRTUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseSRT(content);
        if (parsed.lines.length > 0) {
          const srtLines: LyricLine[] = parsed.lines.map((l) => ({
            id: crypto.randomUUID(),
            text: l.text,
            timestamp: l.timestamp,
          }));
          setLines(srtLines);
          showToast(
            'SRT imported. Please re-add structural tags (e.g., #VERSE) if needed.',
            'warning',
          );
        } else {
          showToast('Failed to parse SRT file or file is empty.', 'error');
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLiriusUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          if (
            parsed &&
            typeof parsed.name === 'string' &&
            Array.isArray(parsed.lyrics)
          ) {
            createProject({
              name: parsed.name,
              lyrics: parsed.lyrics,
            });
            showToast('Project imported successfully!', 'success');
            onClose();
          } else {
            showToast('Invalid .lirius file format.', 'error');
          }
        } catch {
          showToast('Failed to parse .lirius file.', 'error');
        }
      }
    };
    reader.readAsText(file);
    if (liriusInputRef.current) liriusInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim()) return;

    // Filter empty lines
    const cleanedLines = lines
      .map((l) => ({ ...l, text: l.text.trim() }))
      .filter((l) => l.text.length > 0);

    if (cleanedLines.length === 0) {
      showToast('Please add at least one line of lyrics.', 'error');
      return;
    }

    const finalLyrics: LyricLine[] = [
      { id: 'start-marker', text: 'Start', timestamp: null },
      ...cleanedLines,
      { id: 'end-marker', text: 'End of Lyric', timestamp: null },
    ];

    if (editProjectId) {
      updateProject(editProjectId, {
        name: projectName.trim(),
        lyrics: finalLyrics,
        youtubeUrl: youtubeUrl.trim() || undefined,
      });
    } else {
      createProject({
        name: projectName.trim(),
        lyrics: finalLyrics,
        youtubeUrl: youtubeUrl.trim() || undefined,
      });
    }

    onClose();
  };

  // Compute warnings
  const fullText = lines.map((l) => l.text).join('\n');
  const warnings = isOpen ? validateLyrics(fullText) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-5xl h-full max-h-[90vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-200 dark:border-gray-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Left Sidebar (Settings & Tools) */}
        <div className="w-full md:w-80 bg-gray-50 dark:bg-gray-800/50 p-6 flex flex-col shrink-0 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-8">
            <h2
              id="modal-title"
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              {editProjectId ? 'Edit Project' : 'New Project'}
            </h2>
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Project Name
              </label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Track Title"
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                YouTube URL (Optional)
              </label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white transition-all"
              />
            </div>

            {!editProjectId && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Import Files
                </label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept=".srt"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleSRTUpload}
                    id="srt-upload"
                  />
                  <label
                    htmlFor="srt-upload"
                    className="cursor-pointer flex items-center justify-center gap-2 w-full px-4 py-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50 rounded-xl transition-colors font-medium text-sm"
                  >
                    <Upload className="w-4 h-4" /> Import .SRT
                  </label>

                  <input
                    type="file"
                    accept=".lirius"
                    className="hidden"
                    ref={liriusInputRef}
                    onChange={handleLiriusUpload}
                    id="lirius-upload"
                  />
                  <label
                    htmlFor="lirius-upload"
                    className="cursor-pointer flex items-center justify-center gap-2 w-full px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 rounded-xl transition-colors font-medium text-sm"
                  >
                    <FileJson className="w-4 h-4" /> Import .LIRIUS
                  </label>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Quick Insert
              </label>
              <div className="flex flex-wrap gap-1.5">
                {VALID_STRUCTURE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertTag(tag)}
                    className="text-[10px] uppercase font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-md px-2 py-1 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={insertInstrumentalBlock}
                  className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md px-2 py-1 transition-colors w-full mt-1 text-center"
                >
                  + Add Instrumental Block
                </button>
              </div>
            </div>

            {warnings.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mt-auto">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 mb-2 text-sm font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  Formatting Issues ({warnings.length})
                </div>
                <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                  {warnings.slice(0, 4).map((w, i) => (
                    <li key={i}>
                      Line {w.line}: {w.message}
                    </li>
                  ))}
                  {warnings.length > 4 && (
                    <li className="italic opacity-80 mt-1">
                      ...and {warnings.length - 4} more.
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Right Content Area (Editor) */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
          <div className="hidden md:flex items-center justify-end p-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div
            className="flex-1 overflow-y-auto p-6 md:px-12 pb-32"
            id="modal-scroll-container"
          >
            <div className="max-w-2xl mx-auto space-y-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Lyric Editor
                </h3>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                  {lines.length} lines
                </span>
              </div>

              {lines.map((line, index) => {
                const isStructureTag = VALID_STRUCTURE_TAGS.includes(
                  line.text.trim().toUpperCase(),
                );
                return (
                  <div
                    key={line.id}
                    className="group flex items-center gap-2 relative"
                  >
                    <div className="w-6 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-4 h-4 text-gray-400 cursor-grab active:cursor-grabbing" />
                    </div>

                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={line.text}
                        onChange={(e) =>
                          handleTextChange(index, e.target.value)
                        }
                        onPaste={(e) => handlePaste(e, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        placeholder="Type or paste lyrics here..."
                        className={`lyric-line-input w-full px-4 py-2.5 rounded-xl border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                          isStructureTag
                            ? 'border-dashed border-gray-400 dark:border-gray-500 font-mono text-sm text-center uppercase tracking-widest bg-gray-50 dark:bg-gray-800/80'
                            : 'border-gray-200 dark:border-gray-700 text-base shadow-sm hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      />
                    </div>

                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                      <button
                        onClick={() => addLine(index)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Add line below"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeLine(index)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete line"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={() => addLine(lines.length - 1)}
                className="w-full flex items-center justify-center gap-2 p-4 mt-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all font-medium"
              >
                <PlusCircle className="w-5 h-5" /> Add New Line
              </button>
            </div>
          </div>

          <div className="shrink-0 p-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-end gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!projectName.trim() || lines.length === 0}
              className="px-8 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
            >
              {editProjectId ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
