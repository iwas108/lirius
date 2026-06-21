# Lirius App - System Architecture Blueprint

This document acts as the core technical blueprint for the Lirius application. It is updated dynamically to record the implemented design, schemas, and components.

---

## 1. Core Architecture Design

The app follows **Clean Code Architecture** principles, separating responsibilities into logical layers:

- **Presentation Layer (React Components)**: Organized into `features/` (Dashboard, Synchronizer) and shared `components/`. The UI is styled with Tailwind CSS, utilizing a modern, premium design system.
- **State Management Layer (Zustand)**: Global state handling project metadata and active project tracking, persisted to `IndexedDB` via `idb-keyval` for robust storage.
- **Logic & Hook Layer**: Custom React hooks (`useAudioEngine`, `useKeyboardShortcuts`) that abstract complex DOM interactions and audio lifecycle events away from the UI.
- **Utility Layer**: Pure functions for formatting, parsing Musixmatch lyrics, and exporting `.srt`/`.txt` files.

### Key Principles

- **Offline First & Persistence**: Project data and lyric progress is saved locally.
- **Security Constraint Handling**: The browser sandbox prevents persistent access to local audio files (`.flac`). The app maintains lyric state but requires the user to re-select the audio file when reopening a project.
- **Strict TypeScript**: Strongly typed interfaces with no `any` types.

---

## 2. Technical Stack

- **Bundler/Runtime**: Vite + React + TypeScript
- **Styling**: Tailwind CSS v4, Lucide React (Icons)
- **State Management Layer**: Zustand (with persist middleware and custom `idb-keyval` IndexedDB storage)
- **Testing**: Vitest for unit testing utilities and hooks.
- **Code Quality**: ESLint, Prettier.

---

## 3. Database & State Schema

### Zustand Store: `useAppStore`

Stores all projects containing metadata and synchronized lyrics, persisted asynchronously using `idb-keyval` (IndexedDB) to overcome `localStorage` size limits. Audio files are stored ephemerally (not persisted).

```typescript
export interface LyricLine {
  id: string;
  text: string;
  timestamp: number | null; // null if not yet synced
}

export interface Project {
  id: string;
  name: string; // project name or track title
  createdAt: number;
  lyrics: LyricLine[];
  youtubeUrl?: string; // YouTube video URL (optional)
}

export interface AppState {
  projects: Project[];
  activeProjectId: string | null;
  audioFiles: Record<string, File>; // In-memory only
  // Actions...
}
```

---

## 4. Component Structure

```text
├── app/
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/          // Shared UI components (Modals, Buttons)
│       ├── features/
│       │   ├── Dashboard/
│       │   │   ├── Dashboard.tsx
│       │   │   └── CreateProjectModal.tsx
│       │   └── Synchronizer/
│       │       ├── Synchronizer.tsx
│       │       └── HelpModal.tsx
│       ├── hooks/               // Custom logic
│       │   ├── useAudioEngine.ts
│       │   └── useKeyboardShortcuts.ts
│       ├── store/               // Zustand state
│       │   ├── useAppStore.ts
│       │   └── useToastStore.ts
│       ├── types/
│       │   └── index.ts         // Global interfaces
│       ├── utils/
│       │   ├── exportUtils.ts   // SRT and TXT generation
│       │   ├── exportUtils.test.ts
│       │   ├── lyricParser.ts   // Musixmatch lyric parsing rules
│       │   └── lyricParser.test.ts
│       ├── App.tsx
│       ├── main.tsx
│       └── index.css
```

---

## 5. Core Engines & Rules

### Lyric Parsing & Structural Tags (`lyricParser.ts`)

- Implements strict Musixmatch lyric rules.
- Validates structural tags (e.g. `#INSTRUMENTAL`) and cleans inputs.
- Generates UUIDs for each parsed line to allow robust tracking in React lists.

### Audio & Synchronization Engine (`useAudioEngine.ts`)

- Manages the HTML5 `<audio>` element lifecycle for local files.
- Dynamically integrates the YouTube IFrame Player API for streaming sources, exposing a unified interface for duration, playback controls, and time tracking.
- Exposes seek methods, time updates, and duration.
- Coordinates two-way sync: Clicking the audio bar auto-scrolls lyrics, and clicking a synced lyric seeks the audio player.

### Keyboard Shortcuts (`useKeyboardShortcuts.ts`)

- Binds fast synchronization controls:
  - `ArrowDown`: Lock the current lyric line timestamp and step to the next line.
  - `ArrowUp`: Clear the previous line's timestamp and step backwards.
  - `ArrowLeft` / `ArrowRight`: Fine-tune seek time by small increments.

---

## 6. Export Formats

- **`.srt`**: SubRip Subtitle format for standard video players. Excludes non-vocal structural tags (like `#INSTRUMENTAL`).
- **`.txt`**: Standard lyric text file that preserves structural tags, formatted appropriately for Musixmatch/Spotify submission.
