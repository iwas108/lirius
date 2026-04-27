import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Project } from '../types';

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      projects: [],
      activeProjectId: null,
      audioFiles: {},

      setAudioFile: (projectId, file) => {
        set((state) => ({
          audioFiles: {
            ...state.audioFiles,
            [projectId]: file,
          },
        }));
      },

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
        set((state) => {
          const newAudioFiles = { ...state.audioFiles };
          delete newAudioFiles[id];
          return {
            projects: state.projects.filter((p) => p.id !== id),
            activeProjectId:
              state.activeProjectId === id ? null : state.activeProjectId,
            audioFiles: newAudioFiles,
          };
        });
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

      clearLyricTimestampsFromIndex: (projectId, fromIndex) => {
        set((state) => ({
          projects: state.projects.map((project) => {
            if (project.id !== projectId) return project;
            const updatedLyrics = project.lyrics.map((line, index) => {
              if (index > fromIndex) {
                return { ...line, timestamp: null };
              }
              return line;
            });
            return {
              ...project,
              lyrics: updatedLyrics,
            };
          }),
        }));
      },

      updateProject: (projectId, projectData) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId ? { ...project, ...projectData } : project,
          ),
        }));
      },
    }),
    {
      name: 'lirius-storage', // name of item in localStorage
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => key !== 'audioFiles'),
        ) as AppState,
    },
  ),
);
