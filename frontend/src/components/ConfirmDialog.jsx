import { useRef } from 'react';
import Modal from './ui/Modal.jsx';
import Button from './ui/Button.jsx';
import Alert from './ui/Alert.jsx';

export default function ConfirmDialog({ title, message, detail, confirmLabel, isLoading, error, onConfirm, onCancel }) {
  const cancelRef = useRef(null);

  return (
    <Modal title={title} onClose={isLoading ? () => {} : onCancel} initialFocusRef={cancelRef}>
      <div className="space-y-4">
        <Alert type="error">{error}</Alert>
        <p className="text-sm text-slate-700">{message}</p>
        {detail && <p className="break-words rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900">{detail}</p>}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading} loadingText="Deleting…">
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
