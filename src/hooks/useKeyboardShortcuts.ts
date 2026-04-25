import { useEffect } from 'react';

interface KeyboardShortcutOptions {
  onArrowDown: () => void;
  onArrowUp: () => void;
  onArrowLeft: () => void;
  onArrowRight: () => void;
  isActive: boolean;
}

export function useKeyboardShortcuts({
  onArrowDown,
  onArrowUp,
  onArrowLeft,
  onArrowRight,
  isActive,
}: KeyboardShortcutOptions) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          onArrowDown();
          break;
        case 'ArrowUp':
          e.preventDefault();
          onArrowUp();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onArrowLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          onArrowRight();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onArrowDown, onArrowUp, onArrowLeft, onArrowRight]);
}
