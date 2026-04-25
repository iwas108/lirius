import { useState } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { parseLyrics } from '../../utils/lyricParser';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateProjectModal({
  isOpen,
  onClose,
}: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState('');
  const [lyricsText, setLyricsText] = useState('');
  const createProject = useAppStore((state) => state.createProject);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectName.trim() || !lyricsText.trim()) return;

    const lyrics = parseLyrics(lyricsText);

    createProject({
      name: projectName.trim(),
      lyrics,
    });

    // Reset form and close
    setProjectName('');
    setLyricsText('');
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

        <form onSubmit={handleSubmit} className="flex flex-col p-5 space-y-4">
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
            <label
              htmlFor="lyrics"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Plain Text Lyrics
            </label>
            <textarea
              id="lyrics"
              required
              rows={8}
              value={lyricsText}
              onChange={(e) => setLyricsText(e.target.value)}
              placeholder="Paste your lyrics here..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-y"
            ></textarea>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Empty lines will be ignored.
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
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
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
