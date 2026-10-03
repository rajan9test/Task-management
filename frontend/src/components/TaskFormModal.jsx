import { useRef, useState } from 'react';
import Modal from './ui/Modal.jsx';
import Input from './ui/Input.jsx';
import Select from './ui/Select.jsx';
import Button from './ui/Button.jsx';
import Alert from './ui/Alert.jsx';
import { createTask, updateTask } from '../api/tasks.js';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../utils/constants.js';

function toForm(task) {
  return {
    title: task.title ?? '',
    description: task.description ?? '',
    priority: task.priority ?? 'MEDIUM',
    status: task.status ?? 'TODO',
    dueDate: task.dueDate ?? '',
  };
}

function validate(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = 'Title is required';
  else if (form.title.trim().length > 200) errors.title = 'Title must be at most 200 characters';
  if (form.description.length > 2000) errors.description = 'Description must be at most 2000 characters';
  return errors;
}

// Shared create/edit form. `task` is {} for a new task, or an existing task to edit.
export default function TaskFormModal({ task, onClose, onSaved, onNotFound }) {
  const isEdit = Boolean(task.id);
  const titleRef = useRef(null);
  const [form, setForm] = useState(() => toForm(task));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const clientErrors = validate(form);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      status: form.status,
      dueDate: form.dueDate || null,
    };

    setIsSaving(true);
    setServerError('');
    try {
      if (isEdit) {
        await updateTask(task.id, payload);
        onSaved('Task updated successfully');
      } else {
        await createTask(payload);
        onSaved('Task created successfully');
      }
    } catch (err) {
      if (err.status === 404) {
        onNotFound();
        return;
      }
      setServerError(err.message);
      if (err.errors) setErrors(err.errors);
      setIsSaving(false);
    }
  }

  return (
    <Modal title={isEdit ? 'Edit Task' : 'Create Task'} onClose={onClose} initialFocusRef={titleRef}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Alert type="error">{serverError}</Alert>
        <Input
          ref={titleRef}
          id="task-title"
          name="title"
          label="Title"
          maxLength={200}
          value={form.title}
          onChange={handleChange}
          error={errors.title}
          required
        />
        <Input
          as="textarea"
          id="task-description"
          name="description"
          label="Description"
          rows={3}
          maxLength={2000}
          value={form.description}
          onChange={handleChange}
          error={errors.description}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            id="task-priority"
            name="priority"
            label="Priority"
            value={form.priority}
            onChange={handleChange}
            options={PRIORITY_OPTIONS}
            error={errors.priority}
          />
          <Select
            id="task-status"
            name="status"
            label="Status"
            value={form.status}
            onChange={handleChange}
            options={STATUS_OPTIONS}
            error={errors.status}
          />
        </div>
        <Input
          id="task-due-date"
          name="dueDate"
          type="date"
          label="Due date"
          value={form.dueDate}
          onChange={handleChange}
          error={errors.dueDate}
        />
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} loadingText="Saving…">
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
