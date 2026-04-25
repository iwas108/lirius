# Lirius Development Blueprint

This document (`agents.md`) serves as the comprehensive, step-by-step blueprint for developing **Lirius**, a complete web-based lyric timing synchronizer app. As an AI Agent reading this, you are to act as an expert software engineer and follow these instructions meticulously.

## Phase 1: Detailed Context & Architectural Constraints

### 1.1 Project Overview
- **Goal**: Build a web-based app for synchronizing plain-text lyrics with `.flac` audio files, outputting a valid `.srt` file.
- **Tech Stack**: React, Vite, TypeScript, Tailwind CSS, Zustand.
- **Deployment**: GitHub Pages (`https://iwas108.github.io/lirius`) via the `main` branch.

### 1.2 Core Specifications & UX
- **Mobile-First Design**: The UI must be fully responsive, focusing on a mobile-first approach with smart dark/light themes.
- **Local Storage Dashboard (CRUD)**: The app manages multiple sync projects in LocalStorage. Users can Create, Read, Update, and Delete projects.
- **Audio File Constraint & Caching**: Because of browser security constraints, we cannot permanently store `.flac` files in LocalStorage. When resuming a project, prompt the user to re-select the original `.flac` file. However, while navigating between views (like Dashboard and Synchronizer) within the Single Page Application (SPA), the `.flac` file should be cached in memory (e.g., Zustand state or context) so the user does not need to re-upload it unless the page is reloaded.
- **"Musixmatch-like" Interface**: A vertical list of lyrics centered on the screen. Highlight the active line. Show past lines dimmed, and future lines clearly. Provide smooth auto-scrolling to keep the active line centered.
- **Smart Lyric Input Modal**: The lyric pasting/editing modal should be large and include real-time formatting validation based on Musixmatch guidelines (e.g., warnings for capitalization, end-line punctuation, and slang). Provide an "Auto Fix" button to correct issues automatically, and quick-insert buttons for valid structure tags (`#INTRO`, `#VERSE`, `#CHORUS`, `#PRE-CHORUS`, `#HOOK`, `#BRIDGE`, `#OUTRO`, `#INSTRUMENTAL`). Malformed tags should be blocked by the cleanup process.
- **Musixmatch Structure Tags**: Structure tags (e.g., `#VERSE`, `#CHORUS`) should be parsed and displayed as distinct header dividers between blocks of lyrics in the Synchronizer UI, but must be excluded from the final `.srt` output.
- **Seek Bar Integration**: The app must feature an interactive seek bar that is two-way synced with the lyric lines. Clicking a timestamped lyric line jumps the seek bar/audio to that exact time. Conversely, clicking the seek bar updates the active lyric to the nearest matching timestamp and smoothly scrolls it into view.
- **Help Modal**: Display instructions for keyboard shortcuts inside a Help modal/overlay accessible via an info button on both mobile and desktop.
- **Export Options**: Include a dropdown for export options, allowing the user to export as `.srt` (with timings, without structure tags) or as `.txt` (without timings, including Musixmatch structure tags).

### 1.3 Synchronization Keyboard Shortcuts
- **`Down Arrow`**: Lock the current audio time to the active line and move focus to the next line.
- **`Up Arrow`**: Reset the timestamp of the *previous* line, move focus back to it, and allow the user to redo the sync from that point.
- **`Left Arrow`**: Nudge the timestamp of the currently selected/locked line backward by a fine-tune amount (e.g., -100ms).
- **`Right Arrow`**: Nudge the timestamp of the currently selected/locked line forward by a fine-tune amount (e.g., +100ms).

### 1.4 Architecture & Coding Standards
- **Clean Code Architecture**: Enforce strict separation of concerns (UI, State, Audio logic, File parsing).
- **FAIR Principles**: Ensure the code is Findable, Accessible, Interoperable, and Reusable. Document code heavily using JSDoc, maintain semantic HTML, and ensure a high Lighthouse accessibility score.
- **Error Handling**: Implement strict Error Boundaries, `try/catch` blocks, and user-friendly Toast notifications.

---

## Phase 2: Actionable Execution Steps for AI Agent

As an AI agent building this app, execute the following steps sequentially. After each step, verify your work using tests or UI inspection.

**Step 1: Project Initialization**
- Run `npm create vite@latest lirius -- --template react-ts`.
- Clear out the boilerplate code in `src/App.tsx` and `src/main.tsx`.

**Step 2: Dependency Installation**
- Install required dependencies: `tailwindcss`, `postcss`, `autoprefixer`, `zustand`, `lucide-react` (for icons).
- Initialize Tailwind CSS configuration.

**Step 3: Tooling & Clean Code Setup**
- Configure `tsconfig.json` for strict typing.
- Setup ESLint and Prettier. Ensure all files pass linting before proceeding further.

**Step 4: Tailwind & Theme Configuration**
- Configure `tailwind.config.js` with `darkMode: 'class'`.
- Define semantic color variables in `index.css` for both light and dark modes to ensure high contrast and WCAG compliance.

**Step 5: Directory Structure Scaffolding**
- Create the following folder structure in `src/`: `components/`, `features/`, `store/`, `utils/`, `hooks/`, `types/`.
- Create a basic `Layout` component that includes a Header, Main Content area, and a Theme Toggle button.

**Step 6: Define Core TypeScript Interfaces**
- In `src/types/`, define interfaces for `Project` (metadata), `LyricLine` (id, text, timestamp), and `AppState` (Zustand store schema).

**Step 7: Implement Zustand Global Store**
- In `src/store/useAppStore.ts`, create the Zustand store with `persist` middleware.
- Add actions for: creating a project, deleting a project, and setting the active project ID.
- Add memory state (non-persisted) for caching the `.flac` file blob so it persists during SPA navigation.

**Step 8: Build the Dashboard UI (Projects List)**
- Create `src/features/Dashboard/Dashboard.tsx`.
- Implement the UI to list all saved projects from the Zustand store.
- Add a "Create New Project" button that opens a modal.

**Step 9: Implement Plain-Text Lyric Parsing & Validation**
- Create `src/utils/lyricParser.ts`.
- Write a function that takes plain text, splits it by newline, filters out purely empty lines, and returns an array of `LyricLine` objects. Add unit tests for this utility.
- Add a utility function for real-time validation of Musixmatch format rules (capitalization, punctuation, slang) and an Auto Fix function to clean them up.

**Step 10: Build the Smart Project Creation / Editing Flow**
- In the Create Project (or Edit Lyric) modal, make the modal large. Add a form for "Project Name" and a `textarea` for pasting lyrics.
- Implement real-time validation feedback, showing a list of notices or warnings about formatting issues.
- Add an "Auto Fix" button to apply standard formatting, and buttons to quickly insert Musixmatch tags. Block malformed tags.
- On submit, use `lyricParser.ts`, generate a unique Project ID, and save the project metadata to the Zustand store. This modal should be reusable for on-the-fly editing via an "Edit" button in the sync UI.

**Step 11: Build the File Input Handler (.flac)**
- Create `src/components/AudioInput.tsx`.
- Implement a drag-and-drop or file input restricted to `audio/flac`.
- Ensure robust error handling if the user uploads the wrong format.

**Step 12: Audio Player Engine Setup**
- Create `src/hooks/useAudioEngine.ts`.
- Utilize the HTML `<audio>` API to manage `play`, `pause`, `currentTime`, and `duration`.
- Sync the audio element's `currentTime` to a local React state using a `requestAnimationFrame` loop for UI performance. Use the `.flac` blob cached in Zustand if available.

**Step 13: Build the Synchronizer UI Skeleton**
- Create `src/features/Synchronizer/Synchronizer.tsx`.
- Layout the screen: Header with Project Title, Central area for lyrics, and a Bottom bar for audio controls and a seek bar.
- Add a Help icon button that opens an overlay modal explaining the keyboard shortcuts.
- Add an "Edit Lyrics" button that reopens the smart modal for on-the-fly modifications.

**Step 14: Implement the Musixmatch-like Lyric List**
- Render the parsed lyrics in a vertical list. Render Musixmatch tags as distinct header dividers between lyric blocks.
- Apply styling based on line state: Dimmed (past/locked), Highlighted (active), Standard (future).
- Implement a React `ref` and `useEffect` to smoothly auto-scroll the container so the active line remains vertically centered.

**Step 15: Implement the Keyboard Shortcut Hook**
- Create `src/hooks/useKeyboardShortcuts.ts`.
- Bind event listeners for `ArrowDown`, `ArrowUp`, `ArrowLeft`, and `ArrowRight`.
- Ensure shortcuts only fire when the Synchronizer view is active and the user is not typing in an input field.

**Step 16: Connect Sync Logic to State**
- Wire the keyboard shortcuts to Zustand actions.
- Action: `ArrowDown` -> Lock the current audio time to the active line index and increment the active line index.
- Action: `ArrowUp` -> Decrement the active line index and set its timestamp to `null`.
- Action: `ArrowLeft`/`ArrowRight` -> Adjust the active line's timestamp by -100ms / +100ms.

**Step 17: Implement Foolproof Sync Mechanisms & Two-Way Seek**
- Add logic to prevent overlapping timestamps (a line cannot have a timestamp earlier than the previous line + 10ms).
- Add an auto-pause feature: if the audio reaches the end but there are unsynced lines, pause the audio and show a warning.
- Bind clicking a synced lyric line to update the audio `currentTime`.
- Bind clicking the seek bar to update the active lyric line to the closest matched timing and trigger the auto-scroll.

**Step 18: Build Mobile Touch Controls**
- In `Synchronizer.tsx`, render large, ergonomic on-screen buttons (Up, Down, Left, Right) that trigger the exact same actions as the keyboard shortcuts.
- Hide these buttons on larger viewports using Tailwind `hidden md:block` utilities.

**Step 19: Export Generation Logic (SRT & TXT)**
- Create `src/utils/exportUtils.ts`.
- Write a function to format milliseconds into `HH:MM:SS,mmm`.
- Generate `.srt` output: Filter out Musixmatch structure tags, calculating the end time of line `N` as slightly before the start time of line `N+1`. Add unit tests.
- Generate `.txt` output: Include Musixmatch structure tags, omit all timing information.

**Step 20: Export & Download Feature**
- Add a dropdown "Export" button to the Synchronizer view with options for "Export as SRT" and "Export as TXT".
- Hook it up to `exportUtils.ts`. Provide a warning Toast if the user tries to export before all lines are synced.
- Use `Blob` and `URL.createObjectURL` to trigger the download with the appropriate file extension.

**Step 21: GitHub Pages Deployment Configuration**
- Update `vite.config.ts` to include `base: '/lirius/'`.
- Create `.github/workflows/deploy.yml` using the standard Vite + GitHub Pages action template. Ensure it deploys from the `main` branch.

**Step 22: Final QA and Documentation**
- Add comprehensive JSDoc comments to all utilities and hooks.
- Write a detailed `README.md` containing instructions on running the app locally and a summary of architectural decisions.
- Perform a manual QA pass testing the resume workflow (re-selecting `.flac` and verifying state persistence).
