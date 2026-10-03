import Button from './ui/Button.jsx';
import Select from './ui/Select.jsx';
import { fieldClass } from './ui/Input.jsx';
import { PRIORITY_OPTIONS, SORT_OPTIONS, STATUS_OPTIONS } from '../utils/constants.js';

const ALL = { value: '', label: 'All' };

export default function TaskToolbar({ filters, onChange, onClear, onCreate }) {
  const hasActiveFilters = Boolean(filters.search || filters.status || filters.priority);

  function update(event) {
    onChange({ ...filters, [event.target.name]: event.target.value });
  }

  return (
    <section aria-label="Search and filters" className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label htmlFor="search" className="sr-only">
            Search tasks
          </label>
          <input
            id="search"
            name="search"
            type="search"
            placeholder="Search tasks..."
            maxLength={100}
            value={filters.search}
            onChange={update}
            className={`${fieldClass} border-slate-300`}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto">
          <Select
            id="status-filter"
            name="status"
            label="Status"
            hideLabel
            value={filters.status}
            onChange={update}
            options={[{ ...ALL, label: 'All statuses' }, ...STATUS_OPTIONS]}
          />
          <Select
            id="priority-filter"
            name="priority"
            label="Priority"
            hideLabel
            value={filters.priority}
            onChange={update}
            options={[{ ...ALL, label: 'All priorities' }, ...PRIORITY_OPTIONS]}
          />
          <Select
            id="sort"
            name="sort"
            label="Sort by"
            hideLabel
            value={filters.sort}
            onChange={update}
            options={SORT_OPTIONS}
          />
        </div>
        <Button onClick={onCreate} className="whitespace-nowrap">
          + Create Task
        </Button>
      </div>
      {hasActiveFilters && (
        <button type="button" onClick={onClear} className="mt-3 text-sm font-medium text-indigo-600 hover:underline">
          Clear filters
        </button>
      )}
    </section>
  );
}
