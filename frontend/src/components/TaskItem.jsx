import Badge from './ui/Badge.jsx';
import { PRIORITY_OPTIONS, STATUS_OPTIONS, labelFor } from '../utils/constants.js';
import { formatDate, isOverdue } from '../utils/format.js';

const PRIORITY_TONE = { HIGH: 'red', MEDIUM: 'amber', LOW: 'gray' };
const STATUS_TONE = { TODO: 'gray', IN_PROGRESS: 'blue', COMPLETED: 'green' };

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path d="M13.6 3.3a2 2 0 0 1 2.8 2.8l-.8.8-2.8-2.8.8-.8ZM11.7 5.2 3.5 13.4 3 17l3.6-.5 8.2-8.2-3.1-3.1Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
      <path
        fillRule="evenodd"
        d="M8 2a1 1 0 0 0-1 1v1H4a1 1 0 0 0 0 2h.1l.8 10.1A2 2 0 0 0 6.9 18h6.2a2 2 0 0 0 2-1.9L15.9 6h.1a1 1 0 1 0 0-2h-3V3a1 1 0 0 0-1-1H8Zm1 2h2V4H9Zm-1 4a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function TaskItem({ task, isUpdating, onToggleComplete, onEdit, onDelete }) {
  const isCompleted = task.status === 'COMPLETED';
  const overdue = isOverdue(task);
  const checkboxId = `task-${task.id}-complete`;

  return (
    <li className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="pt-0.5">
        <input
          id={checkboxId}
          type="checkbox"
          checked={isCompleted}
          disabled={isUpdating}
          onChange={() => onToggleComplete(task)}
          className="h-5 w-5 cursor-pointer rounded border-slate-300 accent-indigo-600 disabled:cursor-wait"
        />
        <label htmlFor={checkboxId} className="sr-only">
          Mark &quot;{task.title}&quot; as {isCompleted ? 'not completed' : 'completed'}
        </label>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3
            className={`break-words font-medium ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'}`}
          >
            {task.title}
          </h3>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => onEdit(task)}
              aria-label={`Edit task "${task.title}"`}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-500"
            >
              <PencilIcon />
            </button>
            <button
              type="button"
              onClick={() => onDelete(task)}
              aria-label={`Delete task "${task.title}"`}
              className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-red-500"
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        {task.description && <p className="mt-1 line-clamp-2 break-words text-sm text-slate-600">{task.description}</p>}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone={PRIORITY_TONE[task.priority]}>{labelFor(PRIORITY_OPTIONS, task.priority)} priority</Badge>
          <Badge tone={STATUS_TONE[task.status]}>{labelFor(STATUS_OPTIONS, task.status)}</Badge>
          {task.dueDate && (
            <span className={`text-xs ${overdue ? 'font-semibold text-red-700' : 'text-slate-600'}`}>
              {overdue ? 'Overdue · ' : 'Due '}
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Created {formatDate(task.createdAt)} · Updated {formatDate(task.updatedAt)}
        </p>
      </div>
    </li>
  );
}
