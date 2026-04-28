# Lirius

Lirius is a complete web-based lyric timing synchronizer app. It helps users synchronize plain-text lyrics with `.flac` audio files, and output a valid `.srt` or `.txt` file.

## Features

- **Musixmatch-like Interface:** View a vertical list of lyrics centered on the screen, auto-scrolling with the current line. Includes smart lyric input modal enforcing Musixmatch guidelines, an auto-fix utility, and strict structural tag controls.
- **Two-way Synchronization:** Click the audio seek bar to automatically update the active lyric line and auto-scroll, or click a synced lyric line to update the audio seek bar to that timestamp.
- **Keyboard Shortcuts:** Fast synchronization controls using keyboard arrows (Down to lock line/next, Up to reset/previous, Left/Right to fine-tune timing).
- **Responsive & Touch Controls:** Designed mobile-first with smart dark/light theme options using Tailwind CSS. On-screen touch controls available for easy lyric synchronization on both mobile and desktop.
- **Local Dashboard:** Resume incomplete projects straight from your browser. Data is persisted to local storage to manage multiple works (CRUD operations). Due to browser security constraints, you must re-select your original `.flac` file to resume.
- **Advanced SRT & TXT Export:** Generates a correctly formatted `.srt` file for your synchronized lyrics (excluding structural tags), or `.txt` files (including Musixmatch structural tags). Supports advanced handling of `#INSTRUMENTAL` tags.

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
   npm run dev &
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
