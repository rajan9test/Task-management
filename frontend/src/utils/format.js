const DATE_FORMAT = { day: 'numeric', month: 'short', year: 'numeric' };

// Due dates arrive as 'YYYY-MM-DD'. new Date('YYYY-MM-DD') would read them as UTC midnight,
// which shows the previous day west of UTC, so build a local date instead.
function parseDateOnly(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(value) {
  if (!value) return '';
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? parseDateOnly(value) : new Date(value);
  return date.toLocaleDateString(undefined, DATE_FORMAT);
}

export function todayString() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

// 'YYYY-MM-DD' strings compare correctly as plain strings.
export function isOverdue(task) {
  return Boolean(task.dueDate) && task.status !== 'COMPLETED' && task.dueDate < todayString();
}
