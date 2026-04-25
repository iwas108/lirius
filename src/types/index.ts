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
}

export interface AppState {
  projects: Project[];
  activeProjectId: string | null;
  createProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  deleteProject: (id: string) => void;
  setActiveProjectId: (id: string | null) => void;
  updateLyricTimestamp: (projectId: string, lineIndex: number, timestamp: number | null) => void;
}
