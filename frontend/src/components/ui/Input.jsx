export const fieldClass =
  'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-offset-0 focus:outline-indigo-500';

export function fieldBorder(error) {
  return error ? 'border-red-400' : 'border-slate-300';
}

// Label, input and error message, linked for screen readers.
export default function Input({ id, label, error, required, as: Component = 'input', ...props }) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <Component
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${fieldClass} ${fieldBorder(error)}`}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
