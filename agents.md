# Coding Agent System Instructions

You are an autonomous coding agent assigned to build, extend, or improve the Lirius application. Depending on the user's request, you must follow one of the two workflow branches below.

---

## Execution Branches

### Branch A: Epoch-Based Build Phase

**Trigger**: The user request explicitly mentions the term **"Epoch"** (e.g., "Execute Epoch 5").

**Mandated Rules**:

1. **Read the Blueprints First**: Before writing any code, you must view:
   - **[build-plan.md](file:///c:/Users/Aditya%20Suranata/Downloads/github/lirius/build-plan.md)** (if it exists): The multi-step build roadmap.
   - **[architecture.md](file:///c:/Users/Aditya%20Suranata/Downloads/github/lirius/architecture.md)**: System design state.
2. **Strict Epoch Scope**: Only implement the scope defined by the active epoch. Do not write future epoch code.
3. **Document Post-Epoch Changes**: After completing and verifying the epoch:
   - Update **[architecture.md](file:///c:/Users/Aditya%20Suranata/Downloads/github/lirius/architecture.md)** with new components, schemas, or logic.
   - Update **[improvement-record.md](file:///c:/Users/Aditya%20Suranata/Downloads/github/lirius/improvement-record.md)** to log the epoch's features.

---

### Branch B: Continuous Improvement Phase

**Trigger**: The user request **DOES NOT** mention the term **"Epoch"**. This signifies interactive and continuous improvement.

**Mandated Rules**:

1. **Direct Execution**: Focus purely on implementing the direct requirements in the user's prompt.
2. **Log in Improvement Record**: Summarize your changes and write/update them to **[improvement-record.md](file:///c:/Users/Aditya%20Suranata/Downloads/github/lirius/improvement-record.md)**. Organize this file as a numbered list where each improvement is indexed (e.g., `1. [Feature/Fix Name] - Detailed summary of implemented changes`).
3. **Keep Architecture Updated**: If your changes add new files, components, utility hooks, or database structures, you **MUST** update **[architecture.md](file:///c:/Users/Aditya%20Suranata/Downloads/github/lirius/architecture.md)** to keep it in sync with the repository.

---

## Core Architecture Design Principles

Keep these principles in mind when writing code:

- **Clean Architecture**: Keep UI views (`features/`, `components/`) separated from business logic (`hooks/`, `utils/`, `store/`).
- **Offline First**: All user data, configurations, and revisions must persist in local storage via Zustand's persist middleware.
- **Aesthetic Premium**: Match light/dark/system themes seamlessly using Tailwind CSS. Use modern UI practices, responsive layout, and mobile-first design.
- **Data Handling**: Handle `.flac` and other local files securely. Due to browser constraints, audio files cannot be persisted automatically and must be re-linked when reloading projects.
