import { useEffect, useState } from 'react';
import Header from '../components/Header.jsx';
import StatsCards from '../components/StatsCards.jsx';
import TaskToolbar from '../components/TaskToolbar.jsx';
import TaskList from '../components/TaskList.jsx';
import TaskFormModal from '../components/TaskFormModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Alert from '../components/ui/Alert.jsx';
import useDebounce from '../hooks/useDebounce.js';
import { deleteTask, getStats, getTasks, updateTaskStatus } from '../api/tasks.js';

const EMPTY_FILTERS = { search: '', status: '', priority: '', sort: 'newest' };
const NOT_FOUND_MESSAGE = 'Task not found.';

export default function DashboardPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 300);

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState('');

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Bumped after every change (and by Retry) to refetch the list and the stats.
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((key) => key + 1);

  const [feedback, setFeedback] = useState(null); // { type, message }
  const [editingTask, setEditingTask] = useState(null); // null = closed, {} = new, task = edit
  const [deletingTask, setDeletingTask] = useState(null);
  const [deleteState, setDeleteState] = useState({ isLoading: false, error: '' });
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const { status, priority, sort } = filters;

  // Filtering, search and sorting happen on the server.
  useEffect(() => {
    let cancelled = false; // ignore a slow old response that arrives after a newer request
    setTasksLoading(true);
    setTasksError('');
    getTasks({ search: debouncedSearch.trim(), status, priority, sort })
      .then((data) => {
        if (!cancelled) setTasks(data);
      })
      .catch((err) => {
        if (!cancelled) setTasksError(err.message);
      })
      .finally(() => {
        if (!cancelled) setTasksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, status, priority, sort, refreshKey]);

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);
    getStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        // The task list shows the error and the Retry button; keep the last known numbers.
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  function showFeedback(type, message) {
    setFeedback({ type, message });
  }

  function handleSaved(message) {
    setEditingTask(null);
    showFeedback('success', message);
    refresh();
  }

  function handleNotFound() {
    setEditingTask(null);
    setDeletingTask(null);
    showFeedback('error', NOT_FOUND_MESSAGE);
    refresh();
  }

  async function handleToggleComplete(task) {
    const nextStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    setUpdatingTaskId(task.id);
    try {
      await updateTaskStatus(task.id, nextStatus);
      showFeedback('success', nextStatus === 'COMPLETED' ? 'Task marked as completed' : 'Task marked as to do');
      refresh();
    } catch (err) {
      if (err.status === 404) handleNotFound();
      else showFeedback('error', err.message);
    } finally {
      setUpdatingTaskId(null);
    }
  }

  function openDelete(task) {
    setDeleteState({ isLoading: false, error: '' });
    setDeletingTask(task);
  }

  async function handleConfirmDelete() {
    setDeleteState({ isLoading: true, error: '' });
    try {
      await deleteTask(deletingTask.id);
      setDeletingTask(null);
      showFeedback('success', 'Task deleted successfully');
      refresh();
    } catch (err) {
      if (err.status === 404) handleNotFound();
      else setDeleteState({ isLoading: false, error: err.message });
    }
  }

  const hasFilters = Boolean(debouncedSearch.trim() || status || priority);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <StatsCards stats={stats} isLoading={statsLoading && !stats} />

        <TaskToolbar
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters({ ...EMPTY_FILTERS, sort: filters.sort })}
          onCreate={() => setEditingTask({})}
        />

        {feedback && (
          <Alert type={feedback.type} onDismiss={() => setFeedback(null)}>
            {feedback.message}
          </Alert>
        )}

        <TaskList
          tasks={tasks}
          isLoading={tasksLoading}
          error={tasksError}
          hasFilters={hasFilters}
          updatingTaskId={updatingTaskId}
          onRetry={refresh}
          onToggleComplete={handleToggleComplete}
          onEdit={setEditingTask}
          onDelete={openDelete}
        />
      </main>

      {editingTask && (
        <TaskFormModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSaved={handleSaved}
          onNotFound={handleNotFound}
        />
      )}

      {deletingTask && (
        <ConfirmDialog
          title="Delete task"
          message="Are you sure you want to delete this task?"
          detail={deletingTask.title}
          confirmLabel="Delete"
          isLoading={deleteState.isLoading}
          error={deleteState.error}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTask(null)}
        />
      )}
    </div>
  );
}
