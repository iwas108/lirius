import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Project } from '../types';

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      projects: [],
      activeProjectId: null,

      createProject: (projectData) => {
        const newProject: Project = {
          ...projectData,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        };

        set((state) => ({
          projects: [...state.projects, newProject],
          activeProjectId: newProject.id, // optionally auto-select
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProjectId:
            state.activeProjectId === id ? null : state.activeProjectId,
        }));
      },

      setActiveProjectId: (id) => {
        set({ activeProjectId: id });
      },

      updateLyricTimestamp: (projectId, lineIndex, timestamp) => {
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const updatedLyrics = [...project.lyrics];
            if (updatedLyrics[lineIndex]) {
              updatedLyrics[lineIndex] = {
                ...updatedLyrics[lineIndex],
                timestamp,
              };
            }
            return {
              ...project,
              lyrics: updatedLyrics,
            };
          }),
        }));
      },
    }),
    {
      name: 'lirius-storage', // name of item in localStorage
    },
  ),
);
