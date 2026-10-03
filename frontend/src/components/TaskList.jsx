import Button from './ui/Button.jsx';
import Spinner from './ui/Spinner.jsx';
import TaskItem from './TaskItem.jsx';

function Message({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

export default function TaskList({ tasks, isLoading, error, hasFilters, updatingTaskId, onRetry, ...itemHandlers }) {
  // Only replace the list with the loading message on the first load; refetches keep the old list visible.
  if (isLoading && tasks.length === 0) {
    return (
      <Message>
        <div className="flex justify-center">
          <Spinner label="Loading tasks..." />
        </div>
      </Message>
    );
  }

  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center">
        <p className="text-sm text-red-800">{error}</p>
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Message>{hasFilters ? 'No tasks match your search or filters.' : 'No tasks yet. Create your first task!'}</Message>
    );
  }

  return (
    <div>
      <p aria-live="polite" className="mb-2 h-5 text-xs text-slate-400">
        {isLoading ? 'Refreshing…' : `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`}
      </p>
      <ul className="space-y-3">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} isUpdating={updatingTaskId === task.id} {...itemHandlers} />
        ))}
      </ul>
    </div>
  );
}
