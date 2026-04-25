# Lirius Development Blueprint

This document (`agents.md`) serves as the comprehensive, step-by-step blueprint for developing **Lirius**, a complete web-based lyric timing synchronizer app.

Follow these instructions meticulously to ensure a high-quality, maintainable, and foolproof application built on FAIR principles and Clean Code Architecture.

## 1. Project Overview & Requirements
- **Goal**: Build a web-based app for synchronizing plain-text lyrics with `.flac` audio files, outputting a valid `.srt` file.
- **Tech Stack**: React, Vite, TypeScript, Tailwind CSS, Zustand (for state management).
- **Deployment**: GitHub Pages (`https://iwas108.github.io/lirius`) via the `main` branch.
- **Design**: Mobile-first, responsive design with smart dark/light themes.
- **Architecture**: Clean Code Architecture, highly modularized, with clear separation of concerns (UI, State, Audio logic, File parsing).

## 2. Initialization & Setup
- Initialize the project using Vite (`npm create vite@latest lirius -- --template react-ts`).
- Set up Tailwind CSS according to the official Vite integration guide.
- Configure `tsconfig.json` for strict typing.
- Set up ESLint and Prettier for strict code formatting and linting to adhere to Clean Code.

## 3. Theming & Tailwind Configuration
- Configure `tailwind.config.js` to support `darkMode: 'class'` or `media`.
- Define a color palette that ensures high contrast and accessibility (WCAG compliance) for both light and dark themes.
- Implement a theme toggle switch in the UI that defaults to system preference but allows user overrides.

## 4. Clean Code Architecture & Directory Structure
Structure the `src` directory to enforce separation of concerns:
- `src/components/`: Reusable UI components (Buttons, Modals, Inputs).
- `src/features/`: Feature-specific modules (Dashboard, Synchronizer, Player).
- `src/store/`: Zustand state management stores.
- `src/utils/`: Pure functions for parsing, formatting time, and generating SRT.
- `src/hooks/`: Custom React hooks (e.g., keyboard events, audio element controls).
- `src/types/`: TypeScript interfaces and type definitions.

## 5. State Management (Zustand)
Create a global store using Zustand to manage:
- **Projects List**: Metadata of all saved lyric projects (ID, title, last modified date).
- **Current Project**: The currently active project being edited.
- **Sync State**: The array of lyric lines, each containing the text and its locked timestamp.
- **Audio State**: Current playback time, playing/paused status, and duration.
- *Note*: Use `zustand/middleware` for `persist` to automatically save the state to LocalStorage.

## 6. Project Dashboard (CRUD)
- Implement a dashboard view where users can see a list of their projects.
- **Create**: Input field for project name, paste plain-text lyrics.
- **Read**: Display project name, completion percentage, and last edit time.
- **Update**: Click a project to open it in the Synchronizer view.
- **Delete**: Button to remove a project from LocalStorage with a confirmation modal.

## 7. File Input Handling
- Implement a robust drag-and-drop or file selection component for the `.flac` audio file.
- **Crucial Rule**: Because of browser security, we cannot persist the `.flac` file in LocalStorage. When loading a saved project from the dashboard, prompt the user to re-select the corresponding `.flac` file to resume work.

## 8. Plain-Text Lyric Parsing
- When a user inputs plain text, parse it line-by-line.
- Ignore or filter out completely empty lines to prevent synchronization bugs.
- Store the parsed lyrics in the Zustand store as an array of objects: `{ id: string, text: string, timestamp: number | null }`.

## 9. Audio Player Engine
- Create a hidden `<audio>` element or utilize the Web Audio API.
- Create custom, mobile-friendly controls: Play, Pause, Rewind (5s), Forward (5s), and a progress scrubber.
- Sync the audio element's `currentTime` to the Zustand store using a `requestAnimationFrame` loop or `timeupdate` event for precise timing.

## 10. The Synchronizer Interface
- Design a "Musixmatch-like" interface: a vertical list of lyrics centered on the screen.
- Highlight the "current" active line that is awaiting a timestamp.
- Show past (locked) lines in a dimmed color and future (unlocked) lines clearly.
- Provide smooth auto-scrolling to keep the active line centered as the user progresses.

## 11. Keyboard Shortcut Engine
Implement a robust custom hook (`useKeyboardShortcuts`) for the core syncing mechanics:
- **`Down Arrow`**: Lock the current audio time to the active line and move focus to the next line.
- **`Up Arrow`**: Reset the timestamp of the *previous* line, move focus back to it, and allow the user to redo the sync from that point.
- **`Left Arrow`**: Nudge the timestamp of the currently selected/locked line backward by a fine-tune amount (e.g., -100ms).
- **`Right Arrow`**: Nudge the timestamp of the currently selected/locked line forward by a fine-tune amount (e.g., +100ms).

## 12. Auto-Save & Foolproof Mechanisms
- Zustand `persist` handles most auto-saving, but ensure updates to lyric timestamps trigger a save immediately.
- Prevent overlapping timestamps: A line cannot be locked with a time earlier than the preceding line. If `Down Arrow` is pressed too quickly, enforce a minimum gap (e.g., +10ms).
- Warn the user if they attempt to export an `.srt` before all lines have a timestamp.

## 13. SRT Generation Logic
- Write a utility function in `src/utils/srtExport.ts` that converts the internal state array into standard SRT format.
- Format requirements:
  ```
  1
  00:00:00,000 --> 00:00:05,000
  First line of lyric
  ```
- Calculate the end time of line `N` as slightly before the start time of line `N+1`. For the final line, use the total audio duration or a default duration (e.g., +5 seconds).

## 14. Export & Download Feature
- Implement a "Download SRT" button.
- Use `Blob` and `URL.createObjectURL` to trigger a file download directly in the browser without server interaction.
- Name the output file intelligently based on the project title (e.g., `ProjectName_Lirius.srt`).

## 15. Mobile-First Optimization
- Ensure the Synchronizer view is perfectly usable on small touch screens.
- Since mobile lacks physical arrow keys, implement large, ergonomic on-screen buttons (Up, Down, Left, Right) that mimic the keyboard shortcuts.
- Ensure the audio file selector works seamlessly with mobile file pickers.

## 16. Accessibility & FAIR Principles
- **Findable & Accessible**: Add semantic HTML (`<main>`, `<section>`, `<nav>`). Use `aria-labels` on all iconic buttons (Play, Pause, Nudge).
- **Interoperable & Reusable**: Output standard `.srt` format. Ensure the codebase is heavily documented using JSDoc.
- Maintain a high Lighthouse accessibility score.

## 17. Clean Code: Error Handling
- Wrap file parsing and audio loading in `try/catch` blocks.
- Display user-friendly Toast notifications for errors (e.g., "Invalid file format", "Please select the audio file to resume").
- Implement React Error Boundaries to prevent the entire app from crashing if a single component fails.

## 18. Testing Strategy
- Set up Vitest and React Testing Library.
- Write unit tests for the core utilities (SRT formatting, time parsing).
- Write integration tests for the Zustand store (adding a project, locking a timestamp).

## 19. GitHub Pages Deployment Configuration
- Configure `vite.config.ts` with `base: '/lirius/'` so asset paths resolve correctly on GitHub Pages.
- Create a GitHub Actions workflow (`.github/workflows/deploy.yml`) to automatically build and deploy the React app to the `gh-pages` environment whenever code is pushed to `main`.

## 20. Documentation & Final Polish
- Write a comprehensive `README.md` detailing how to use the app, how to run it locally, and the architectural decisions.
- Perform a final manual QA pass, testing the keyboard shortcuts extensively to ensure zero lag between keypress and timestamp locking.
