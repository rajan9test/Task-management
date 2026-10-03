import { useEffect, useId, useRef } from 'react';

// Accessible dialog: Escape and a backdrop click close it, focus moves inside on open
// (to `initialFocusRef` if given) and goes back to the opening element on close.
export default function Modal({ title, onClose, initialFocusRef, children }) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    (initialFocusRef?.current ?? dialogRef.current)?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') onCloseRef.current();
    }
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previouslyFocused?.focus?.();
    };
  }, [initialFocusRef]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0" aria-hidden="true" onClick={() => onCloseRef.current()} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl focus:outline-none sm:max-w-lg sm:rounded-2xl"
      >
        <h2 id={titleId} className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
