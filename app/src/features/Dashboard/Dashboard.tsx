import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import CreateProjectModal from './CreateProjectModal';

export default function Dashboard() {
  const { projects, deleteProject, setActiveProjectId } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateNewProject = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-bold">Your Projects</h2>
        <button
          onClick={handleCreateNewProject}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          Create New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No projects found. Create one to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              <h3
                className="font-semibold text-lg mb-2 truncate"
                title={project.name}
              >
                {project.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {new Date(project.createdAt).toLocaleDateString()}
              </p>

              <div className="mt-auto flex gap-2">
                <button
                  onClick={() => setActiveProjectId(project.id)}
                  className="flex-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Open
                </button>
                <button
                  onClick={() => deleteProject(project.id)}
                  className="px-3 py-1.5 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  aria-label={`Delete ${project.name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
