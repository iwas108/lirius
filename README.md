# Lirius

Lirius is a complete web-based lyric timing synchronizer app. It helps users synchronize plain-text lyrics with `.flac` audio files, and output a valid `.srt` file.

## Features

- **Musixmatch-like Interface:** View a vertical list of lyrics centered on the screen, auto-scrolling with the current line.
- **Keyboard Shortcuts:** Fast synchronization controls using keyboard arrows (Lock line, Nudge, Reset).
- **Responsive & Dark Mode:** Designed mobile-first with smart dark/light theme options using Tailwind CSS.
- **Local Dashboard:** Resume incomplete projects straight from your browser. Data is persisted to local storage (due to browser security constraints, you must re-select your original `.flac` file to resume).
- **Export to SRT:** Generates a correctly formatted `.srt` file for your synchronized lyrics.

## Technology Stack

- **Frontend:** React, Vite, TypeScript
- **Styling:** Tailwind CSS, Lucide React (Icons)
- **State Management:** Zustand (with persist middleware)
- **Testing:** Vitest

## Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run the Development Server:**
   ```bash
   npm run dev
   ```

3. **Build for Production:**
   ```bash
   npm run build
   ```

4. **Lint the Code:**
   ```bash
   npm run lint
   ```

5. **Run the Tests:**
   ```bash
   npm run test
   ```

## Architectural Decisions

- **Clean Code Architecture:** Emphasizes strict separation between UI (`features/`, `components/`), State (`store/`), Audio/Shortcut Logic (`hooks/`), and Formatting (`utils/`).
- **Data Persistence:** `zustand` combined with local storage lets the application persist project metadata and lyric progress without requiring a backend.
- **Security Constrains Handling:** The browser cannot persistently store `.flac` files on the user's hard drive without their intervention. The app deliberately requests the file selection upon returning to an ongoing project while maintaining lyric states.
- **TypeScript Strictness:** Project avoids `any` types by utilizing interface-driven models found in `src/types`.
