# Lirius Application Improvement Record

This log records features, fixes, and architectural adjustments completed on the Lirius application.

---

## Completed Improvements

### 1. Initial Scaffolding & Setup

- **Scaffolding**: Created Vite + React + TypeScript + Tailwind CSS template.
- **State Management ([useAppStore.ts](file:///c:/Users/Aditya%20Suranata/Downloads/github/lirius/app/src/store/useAppStore.ts))**: Set up Zustand store with persist middleware to manage local project CRUD operations and active project state.

### 2. Core Dashboard

- **Dashboard Interface ([Dashboard.tsx](file:///c:/Users/Aditya%20Suranata/Downloads/github/lirius/app/src/features/Dashboard/Dashboard.tsx))**: Built project listing with local storage resume capability.
- **Security Workaround**: Addressed browser security constraints prohibiting `.flac` persistence by requiring manual file re-selection on resume while safely preserving mapped lyric timestamps.

### 3. Lyric Parser & Synchronization Core

- **Parser Utility ([lyricParser.ts](file:///c:/Users/Aditya%20Suranata/Downloads/github/lirius/app/src/utils/lyricParser.ts))**: Implemented Musixmatch-compliant lyric parsing and cleaning, validating structural tags like `#INSTRUMENTAL`.
- **Audio Hook ([useAudioEngine.ts](file:///c:/Users/Aditya%20Suranata/Downloads/github/lirius/app/src/hooks/useAudioEngine.ts))**: Abstracted HTML5 audio element binding, time updating, and seeking capabilities into a robust reusable hook.
- **Keyboard Controls ([useKeyboardShortcuts.ts](file:///c:/Users/Aditya%20Suranata/Downloads/github/lirius/app/src/hooks/useKeyboardShortcuts.ts))**: Added high-speed arrow key bindings for timeline locking and precise seeking.

### 4. Synchronizer UI

- **Editing Interface ([Synchronizer.tsx](file:///c:/Users/Aditya%20Suranata/Downloads/github/lirius/app/src/features/Synchronizer/Synchronizer.tsx))**: Designed a two-way interactive UI where users can seek audio via lyric lines and vice versa, with automatic vertical scrolling tracking the active line.
- **Help Modal ([HelpModal.tsx](file:///c:/Users/Aditya%20Suranata/Downloads/github/lirius/app/src/features/Synchronizer/HelpModal.tsx))**: Added accessible documentation for shortcuts and platform guidelines.

### 5. Export Systems

- **Export Utility ([exportUtils.ts](file:///c:/Users/Aditya%20Suranata/Downloads/github/lirius/app/src/utils/exportUtils.ts))**: Built functions to generate strictly formatted `.srt` files (ignoring structural tags) and `.txt` files (preserving tags) from timestamped lyric arrays.

### 6. Major UI & Database Refactor

- **Database Migration**: Replaced Zustand's `localStorage` persist engine with an asynchronous `idb-keyval` (IndexedDB) integration to bypass the 5MB browser storage limits.
- **Marketing Page Styling**: Updated the root `index.html` to utilize Vite-compiled Tailwind CSS instead of inline styles.
- **Line-by-Line Editor ([CreateProjectModal.tsx](file:///c:/Users/Aditya%20Suranata/Downloads/github/lirius/app/src/features/Dashboard/CreateProjectModal.tsx))**: Refactored the import modal into a full-screen panel. Replaced the single `<textarea>` with unique `LyricLine` input fields to allow persistent tracking of timestamps even if lyrics text changes. Included a smart paste handler that splits large text blocks.
- **Dashboard Table ([Dashboard.tsx](file:///c:/Users/Aditya%20Suranata/Downloads/github/lirius/app/src/features/Dashboard/Dashboard.tsx))**: Upgraded the project list into a comprehensive table featuring sorting (by Name, Date, Progress), pagination, and search capabilities. Added system-level storage stats fetching via `navigator.storage.estimate`.
- **Synchronizer Polish ([Synchronizer.tsx](file:///c:/Users/Aditya%20Suranata/Downloads/github/lirius/app/src/features/Synchronizer/Synchronizer.tsx))**: Completely overhauled the syncing interface using premium, modern styling. Included frosted glass headers, scale-and-opacity gradients for lyric lines, and a floating bottom player bar.

### 7. Build Verification & Developer Documentation

- **Build & Linter Fixes**: Fixed TypeScript indexing errors, type-only imports, and React hook ESLint violations across `Dashboard.tsx`, `CreateProjectModal.tsx`, and `useAppStore.ts` to ensure `npm run build` and `npm run lint` succeed cleanly.
- **Developer Documentation ([README.md](file:///c:/Users/Aditya%20Suranata/Downloads/github/lirius/README.md))**: Updated the repository documentation with clear setup, run, build, and test instructions. Documented the IndexedDB storage architecture and noted the build dependency of the root marketing page `index.html` on the compiled Tailwind CSS file.

### 8. YouTube Player Integration & Inline Editing

- **YouTube Support**: Integrated the YouTube IFrame Player API in `useAudioEngine.ts` to allow users to sync lyrics directly with YouTube videos. Added a YouTube URL configuration field in `CreateProjectModal.tsx` and a direct YouTube URL loader input to the "Load Audio Source" screen, rendering the player dynamically on the sync page.
- **YouTube DOM Crash Fix**: Wrapped the target YouTube player DOM container inside `dangerouslySetInnerHTML` in `Synchronizer.tsx` to prevent React's virtual DOM reconciliation from throwing a `NotFoundError` when the third-party YouTube API replaces the container element with an iframe.
- **YouTube Origin Handshake Fix**: Added explicit `origin` parameter to `playerVars` inside [useAudioEngine.ts](file:///c:/Users/Aditya%20Suranata/Downloads/github/lirius/app/src/hooks/useAudioEngine.ts) matching `window.location.origin` to resolve browser postMessage origin mismatch warning logs in the developer console.
- **YouTube Loading Blinker Loop Fix**: Guarded player initialization in `Synchronizer.tsx` with `lastLoadedSourceRef` and removed the unstable `isReady` dependency from the loader `useEffect` to prevent infinite rendering reload loops. Cleaned up background interval handles inside `useAudioEngine.ts` using `ytIntervalRef`.
- **YouTube Loading Header Buttons Display**: Updated the condition to render the sync header controls to check if `youtubeId` is set, ensuring buttons like 'Edit Lyrics', 'Help', and 'Export' display during player loading and buffering.
- **Fixed Floating Player**: Changed the floating bottom player widget wrapper from absolute to fixed positioning so it remains fixed on the viewport while lyrics are scrolled.
- **Inline Editing**: Added double-click handlers on lyric lines and a dedicated "Edit Text" button in the active control strip to support inline editing of text-only (non-structural) lines.
- **Lyric Text Padding**: Added vertical padding to the large active lyric line element to prevent browser descender clipping.

### 9. Dashboard Sync Progress & YouTube Loading Fixes

- **Sync Progress Refactoring**: Updated progress calculation on the dashboard to exclude structural tags (like `#INTRO`, `#VERSE`, `#CHORUS`, etc.) and start/end markers. Only ordinary lyric text lines and instrumental/silence tags (`#INSTRUMENTAL` / `🎵`) are counted in the sync percentage.
- **YouTube Player Loading Stalled Fix**: Solved the issue where the YouTube player gets stuck at "Loading YouTube Player..." after destruction or during component remounts (such as in React StrictMode). The script is now initialized via `window.YT.ready` once loaded, and a persistent `#youtube-player-container` is used in the DOM which programmatically recreates the inner player element if it is deleted by the YouTube API `.destroy()` method.
- **YouTube enablejsapi Integration**: Explicitly set the `enablejsapi: 1` option in player parameters to ensure that events (`onReady` and `onStateChange`) correctly propagate to the parent page.
- **State Update Decoupling**: Refactored the options parameter in `useAudioEngine` hook using a React `useRef` wrapper (`optionsRef`) to decouple hook dependency arrays from parent component rendering changes, resolving unnecessary player reload and animation-frame render loops.

### 10. YouTube Player Initialization & Interval Race Condition Fix

- **YouTube Interval Race Condition**: Fixed a critical race condition where the YouTube player loading interval (`ytIntervalRef`) was prematurely cleared by React's state transitions. This occurred because changing `playerType` (from `null` or `'html5'` to `'youtube'`) triggered the cleanup function of the hooks' `useEffect` blocks before the interval had a chance to execute.
- **Hook Lifecycle Refactoring**: Moved the YouTube player load interval check directly inside a dedicated `useEffect` block in `useAudioEngine.ts` that triggers only when `playerType === 'youtube'`, ensuring its setup and teardown are fully managed by React's lifecycle and immune to intermediate state transitions. Removed manual interval creation from the `loadYouTube` callback and stored the active video ID in a stable `activeVideoIdRef`.

### 11. Visual Markers for Unsynchronized Lyric Lines

- **Visual Sync Indicators**: Added a subtle, amber glow indicator dot next to any unsynchronized lyric line in the synchronizer view. These indicators strictly align with the dashboard's "Sync Progress" rules, displaying only on active, syncable text lines or instrumental tags (`🎵`) that have no timestamps assigned.
- **Visual Balance Alignment**: Added a matching invisible spacer to the right of the lyric text for lines containing the indicator, ensuring that the lyric line text remains perfectly centered in the layout.
- **Instrumental Progress Alignment**: Excluded the structural `#INSTRUMENTAL` tag itself from dashboard progress calculations, resolving a discrepancy where projects with instrumentals could never reach 100% sync status.

### 12. Lyric Editor Drag-and-Drop Reordering & Contextual Tag Insertion

- **Lyric Line Reordering**: Implemented smooth HTML5 drag-and-drop reordering inside `CreateProjectModal.tsx`. Users can grab the `GripVertical` handle on any row to drag and insert it at a new position. The list updates in real-time, providing immediate visual feedback by dimming and scaling the dragged row. Text selection within input fields is completely preserved because only the grip handle is marked as draggable.
- **Contextual Quick Insert**: Modified the "Quick Insert" buttons (`#INTRO`, `#VERSE`, etc.) and the "Add Instrumental Block" button to insert tags directly above the currently active (focused) lyric line instead of appending them to the bottom of the list. The new input field automatically gains focus post-insertion.

### 13. Lyric Editor Auto Fix for Illegal Characters

- **Auto Fix Button**: Introduced a "Lyric Tools" section in the project creation and edit modal containing an "Auto Fix Illegal Characters" button.
- **Illegal Character Filtering**: The cleanup process targets only non-structural lyric lines, filtering out any characters not matching the allowed set (letters `A-Za-z`, numbers `1-9`, hyphens `-`, commas `,`, double quotes `"`, parentheses `()`, and spaces). Dots/periods `.` and other invalid punctuation/symbols are programmatically stripped, and a summary toast notification reports the count of cleaned lines.

### 14. Formatting Issues Live Validation & Instrumental Music Notation

- **Illegal Character Validation in `validateLyrics`**: Extended the `validateLyrics` function in `lyricParser.ts` to detect illegal characters on non-structural lyric lines. The "Formatting Issues" counter in the project editor now auto-updates reactively as lines are edited, focused/blurred, or after the auto fix button is pressed, since the validation derives directly from the `lines` state.
- **Instrumental Tag Music Notation**: Updated the `#INSTRUMENTAL` structure tag rendering in `Synchronizer.tsx` to display with music notation emojis (`🎵 INSTRUMENTAL 🎵`) instead of plain text, providing a clear visual distinction from other structure tags like `#VERSE` or `#CHORUS`.
