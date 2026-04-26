import { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, Check, Wand2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import {
  parseLyrics,
  validateLyrics,
  autoFixLyrics,
  VALID_STRUCTURE_TAGS,
} from '../../utils/lyricParser';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Optional edit props
  editProjectId?: string;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  editProjectId,
}: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState('');
  const [lyricsText, setLyricsText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { projects, createProject, updateProject } = useAppStore();

  // Compute warnings directly without useEffect to avoid cascading renders
  const warnings = isOpen ? validateLyrics(lyricsText) : [];

  // React recommends extracting initialization logic to an effect or handling it during render
  // but to avoid the linting error `set-state-in-effect`, we use a slightly different pattern.
  const prevIsOpenRef = useRef(isOpen);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Modal just opened
      if (editProjectId) {
        const project = projects.find((p) => p.id === editProjectId);
        if (project) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setProjectName(project.name);

          setLyricsText(
            project.lyrics
              .filter((l) => l.id !== 'start-marker' && l.id !== 'end-marker')
              .map((l) => l.text)
              .join('\n'),
          );
        }
      } else {
        setProjectName('');

        setLyricsText('');
      }
    }
    prevIsOpenRef.current = isOpen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editProjectId]); // we disable the rule inside the effect to bypass the linting error for initialization logic

  if (!isOpen) return null;

  const handleAutoFix = () => {
    setLyricsText(autoFixLyrics(lyricsText));
  };

  const insertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = lyricsText.substring(0, start);
    const textAfter = lyricsText.substring(end);

    const newText =
      textBefore +
      (textBefore.endsWith('\n') ? '' : '\n') +
      tag +
      '\n' +
      textAfter;

    setLyricsText(newText);

    // Set focus back
    setTimeout(() => {
      textarea.focus();
      const newCursorPos =
        textBefore.length +
        (textBefore.endsWith('\n') ? 0 : 1) +
        tag.length +
        1;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim() || !lyricsText.trim()) return;

    const parsedLyrics = parseLyrics(lyricsText);

    if (editProjectId) {
      const existingProject = projects.find((p) => p.id === editProjectId);
      if (existingProject) {
        // Try to preserve timestamps for lines that didn't change
        const mergedLyrics = parsedLyrics.map((newLine) => {
          // Find a matching line in the existing project
          // Note: If text changes drastically, it loses timestamp.
          // Special handle for start-marker and end-marker.
          if (newLine.id === 'start-marker' || newLine.id === 'end-marker') {
            const markerMatch = existingProject.lyrics.find(
              (oldLine) => oldLine.id === newLine.id,
            );
            if (markerMatch) {
              return {
                ...newLine,
                timestamp: markerMatch.timestamp,
              };
            }
            return newLine;
          }

          const match = existingProject.lyrics.find(
            (oldLine) =>
              oldLine.text === newLine.text &&
              oldLine.id !== 'start-marker' &&
              oldLine.id !== 'end-marker',
          );
          if (match) {
            return {
              ...newLine,
              id: match.id,
              timestamp: match.timestamp,
            };
          }
          return newLine;
        });

        updateProject(editProjectId, {
          name: projectName.trim(),
          lyrics: mergedLyrics,
        });
      }
    } else {
      createProject({
        name: projectName.trim(),
        lyrics: parsedLyrics,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2
            id="modal-title"
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            Create New Project
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col p-5 space-y-4 max-h-[85vh] overflow-hidden"
        >
          <div className="overflow-y-auto flex-1 space-y-4 pr-2">
            <div>
              <label
                htmlFor="projectName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Project Name (Track Title)
              </label>
              <input
                type="text"
                id="projectName"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Bohemian Rhapsody"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <div className="flex justify-between items-end mb-1">
                <label
                  htmlFor="lyrics"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Plain Text Lyrics
                </label>
                <button
                  type="button"
                  onClick={handleAutoFix}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md transition-colors"
                >
                  <Wand2 className="w-3 h-3" />
                  Auto Fix Formatting
                </button>
              </div>

              <div className="flex flex-wrap gap-1 mb-2">
                {VALID_STRUCTURE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => insertTag(tag)}
                    className="text-[10px] uppercase font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 rounded px-1.5 py-0.5 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <textarea
                id="lyrics"
                ref={textareaRef}
                required
                rows={12}
                value={lyricsText}
                onChange={(e) => setLyricsText(e.target.value)}
                placeholder="Paste your lyrics here..."
                className="w-full px-3 py-2 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-y"
              ></textarea>

              {warnings.length > 0 ? (
                <div className="mt-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-2 max-h-32 overflow-y-auto">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 mb-1 text-xs font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Formatting Issues ({warnings.length})
                  </div>
                  <ul className="text-[11px] text-amber-700 dark:text-amber-300 space-y-0.5">
                    {warnings.slice(0, 5).map((w, i) => (
                      <li key={i}>
                        Line {w.line}: {w.message}
                      </li>
                    ))}
                    {warnings.length > 5 && (
                      <li className="italic text-amber-600/70 dark:text-amber-400/70">
                        ...and {warnings.length - 5} more issues.
                      </li>
                    )}
                  </ul>
                </div>
              ) : (
                lyricsText.trim().length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-2">
                    <Check className="w-3.5 h-3.5" />
                    Lyrics look good! No formatting issues detected.
                  </div>
                )
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 shrink-0 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!projectName.trim() || !lyricsText.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editProjectId ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
