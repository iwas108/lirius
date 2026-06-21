# Lirius

Lirius is a complete web-based lyric timing synchronizer app. It helps users synchronize plain-text lyrics with `.flac` audio files, and output a valid `.srt` or `.txt` file.

## Features

- **Musixmatch-like Interface:** View a vertical list of lyrics centered on the screen, auto-scrolling with the current line. Includes smart lyric input modal enforcing Musixmatch guidelines, an auto-fix utility, and strict structural tag controls.
- **Two-way Synchronization:** Click the audio seek bar to automatically update the active lyric line and auto-scroll, or click a synced lyric line to update the audio seek bar to that timestamp.
- **Keyboard Shortcuts:** Fast synchronization controls using keyboard arrows (Down to lock line/next, Up to reset/previous, Left/Right to fine-tune timing).
- **Responsive & Touch Controls:** Designed mobile-first with smart dark/light theme options using Tailwind CSS. On-screen touch controls available for easy lyric synchronization on both mobile and desktop.
- **Local Dashboard:** Resume incomplete projects straight from your browser. Data is persisted to IndexedDB (using `idb-keyval`) to support larger database sizes and prevent the 5MB browser storage limits of `localStorage`. Manage multiple works with table search, sorting, filtering, and pagination. Due to browser security constraints, you must re-select your original `.flac` file to resume audio playback.
- **Advanced SRT & TXT Export:** Generates a correctly formatted `.srt` file for your synchronized lyrics (excluding structural tags), or `.txt` files (including Musixmatch structural tags). Supports advanced handling of `#INSTRUMENTAL` tags.

## Technology Stack

- **Frontend:** React, Vite, TypeScript
- **Styling:** Tailwind CSS, Lucide React (Icons)
- **State Management & Storage:** Zustand, IndexedDB (via `idb-keyval`)
- **Testing:** Vitest

## Getting Started

Follow these instructions to run, build, and test Lirius locally:

### 1. Install Dependencies

Ensure you have [Node.js](https://nodejs.org/) installed, then run:

```bash
npm install
```

### 2. Run the Development Server

Launch the development server with hot-module replacement (HMR):

```bash
npm run dev
```

Once started, the application will be accessible at `http://localhost:5173/lirius/dist/` (or the local address shown in your terminal).

### 3. Build for Production

To build the application for deployment:

```bash
npm run build
```

This runs the TypeScript compiler check (`tsc -b`) and bundles the frontend app using Vite into the `/dist` directory.

> [!NOTE]
> The repository's root marketing page (`index.html`) relies on the compiled styles generated in `dist/assets/index.css`. To ensure the root landing page renders with correct styles and layout, you must execute `npm run build` at least once.

### 4. Code Formatting & Linting

Ensure code quality and style guidelines are met using ESLint and Prettier:

```bash
# Run lint check
npm run lint

# Format the codebase
npx prettier --write .
```

### 5. Run Unit Tests

Run the unit test suite built with Vitest:

```bash
npm run test
```

## Architectural Decisions

- **Clean Code Architecture:** Emphasizes strict separation between UI views (`features/`, `components/`), State (`store/`), Custom Audio/Shortcut Hooks (`hooks/`), and Formatting/Parsing Utilities (`utils/`).
- **IndexedDB Data Persistence:** Replaced simple local storage persistence with an asynchronous `idb-keyval` implementation in Zustand. This ensures that extensive timing projects with large numbers of lyric lines do not crash the app or exceed browser storage quotas.
- **Security Constraints Handling:** The browser sandbox prevents persistent access to local audio files (`.flac`). The app maintains lyric timing states but requires the user to re-select the audio file when reopening a project.
- **TypeScript Strictness:** Project avoids `any` types by utilizing interface-driven models found in `src/types` and strict compiler options.
