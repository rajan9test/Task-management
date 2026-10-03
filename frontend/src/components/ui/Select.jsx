import { fieldBorder, fieldClass } from './Input.jsx';

// options: [{ value, label }]
export default function Select({ id, label, options, error, hideLabel = false, ...props }) {
  return (
    <div>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'mb-1 block text-sm font-medium text-slate-700'}>
        {label}
      </label>
      <select id={id} className={`${fieldClass} ${fieldBorder(error)}`} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
