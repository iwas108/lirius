import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import CreateProjectModal from './CreateProjectModal';
import {
  Search,
  ChevronUp,
  ChevronDown,
  Trash2,
  FolderOpen,
  HardDrive,
  FileAudio,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  Plus,
  Play,
} from 'lucide-react';

type SortField = 'name' | 'createdAt' | 'progress';
type SortOrder = 'asc' | 'desc';

interface SortIconProps {
  field: SortField;
  sortField: SortField;
  sortOrder: SortOrder;
}

const SortIcon = ({ field, sortField, sortOrder }: SortIconProps) => {
  if (sortField !== field) {
    return <div className="w-4 h-4 opacity-0 group-hover:opacity-30" />;
  }
  return sortOrder === 'asc' ? (
    <ChevronUp className="w-4 h-4 text-blue-500" />
  ) : (
    <ChevronDown className="w-4 h-4 text-blue-500" />
  );
};

const EXCLUDED_PROGRESS_TAGS = [
  '#INTRO',
  '#VERSE',
  '#CHORUS',
  '#PRE-CHORUS',
  '#HOOK',
  '#BRIDGE',
  '#OUTRO',
];

const getSyncableLyricsCount = (
  lyrics: { id: string; text: string; timestamp: number | null }[],
) => {
  const syncable = lyrics.filter((l) => {
    if (l.id === 'start-marker' || l.id === 'end-marker') return false;
    const textUpper = l.text.trim().toUpperCase();
    if (EXCLUDED_PROGRESS_TAGS.includes(textUpper)) return false;
    return true;
  });

  const synced = syncable.filter((l) => l.timestamp !== null).length;
  return {
    synced,
    total: syncable.length,
  };
};

export default function Dashboard() {
  const { projects, deleteProject, setActiveProjectId } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Table State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Storage Stats State
  const [storageUsage, setStorageUsage] = useState<string>('Calculating...');

  useEffect(() => {
    async function estimateStorage() {
      if (navigator.storage && navigator.storage.estimate) {
        try {
          const estimation = await navigator.storage.estimate();
          if (estimation.usage !== undefined) {
            const mb = (estimation.usage / (1024 * 1024)).toFixed(2);
            setStorageUsage(`${mb} MB`);
          } else {
            setStorageUsage('Unknown');
          }
        } catch {
          setStorageUsage('Unknown');
        }
      } else {
        setStorageUsage('Not Supported');
      }
    }
    estimateStorage();
  }, [projects]);

  const handleCreateNewProject = () => {
    setIsModalOpen(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredProjects = useMemo(() => {
    let result = projects;
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(lowerQuery));
    }

    result.sort((a, b) => {
      let valA: string | number = 0;
      let valB: string | number = 0;

      if (sortField === 'progress') {
        const statsA = getSyncableLyricsCount(a.lyrics);
        const statsB = getSyncableLyricsCount(b.lyrics);
        valA = statsA.total ? statsA.synced / statsA.total : 0;
        valB = statsB.total ? statsB.synced / statsB.total : 0;
      } else if (sortField === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortField === 'createdAt') {
        valA = a.createdAt;
        valB = b.createdAt;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [projects, searchQuery, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(start, start + itemsPerPage);
  }, [filteredProjects, currentPage]);

  const totalStats = useMemo(() => {
    return projects.reduce(
      (acc, p) => {
        const stats = getSyncableLyricsCount(p.lyrics);
        return {
          synced: acc.synced + stats.synced,
          total: acc.total + stats.total,
        };
      },
      { synced: 0, total: 0 },
    );
  }, [projects]);

  const totalSyncedLines = totalStats.synced;
  const totalLines = totalStats.total;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 bg-gray-50/50 dark:bg-gray-900/50 min-h-screen">
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage and synchronize your lyric projects.
          </p>
        </div>
        <button
          onClick={handleCreateNewProject}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-blue-500/50"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 flex items-center gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Projects
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {projects.length}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 flex items-center gap-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <LayoutList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Lines Synced
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalSyncedLines}{' '}
              <span className="text-sm font-normal text-gray-400">
                / {totalLines}
              </span>
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 flex items-center gap-4">
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Storage Usage
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {storageUsage}
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/40 dark:shadow-black/20 border border-gray-100 dark:border-gray-700/60 overflow-hidden flex flex-col">
        {/* Table Controls */}
        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/30 dark:bg-gray-800/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                <th
                  onClick={() => handleSort('name')}
                  className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    Project Name{' '}
                    <SortIcon
                      field="name"
                      sortField={sortField}
                      sortOrder={sortOrder}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('createdAt')}
                  className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    Created{' '}
                    <SortIcon
                      field="createdAt"
                      sortField={sortField}
                      sortOrder={sortOrder}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('progress')}
                  className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    Sync Progress{' '}
                    <SortIcon
                      field="progress"
                      sortField={sortField}
                      sortOrder={sortOrder}
                    />
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <FileAudio className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-lg font-medium">No projects found</p>
                      <p className="text-sm mt-1">
                        Adjust your search or create a new project.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((project) => {
                  const stats = getSyncableLyricsCount(project.lyrics);
                  const progressPct =
                    stats.total > 0
                      ? Math.round((stats.synced / stats.total) * 100)
                      : 0;

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900 dark:text-white text-base">
                          {project.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          ID: {project.id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {new Date(project.createdAt).toLocaleDateString(
                          undefined,
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          },
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 w-8">
                            {progressPct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                          <button
                            onClick={() => setActiveProjectId(project.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <Play className="w-4 h-4" /> Open
                          </button>
                          <button
                            onClick={() => deleteProject(project.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                            aria-label="Delete project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {Math.min(currentPage * itemsPerPage, filteredProjects.length)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {filteredProjects.length}
              </span>{' '}
              results
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
