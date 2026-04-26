import { X, ArrowDown, ArrowUp, ArrowLeft, ArrowRight } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2
            id="help-modal-title"
            className="text-xl font-bold text-gray-900 dark:text-white"
          >
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <ArrowDown className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Sync Current Line (Down Arrow)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Lock the current audio time to the active line and move to the
                next.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <ArrowUp className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Undo Previous Line (Up Arrow)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Reset the timestamp of the previous line and move back to it.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex gap-1">
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <ArrowRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Fine-tune Timing (Left / Right Arrow)
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Nudge the timestamp of the most recently synced line backward or
                forward by 100ms.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
