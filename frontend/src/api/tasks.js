import { apiRequest } from './client.js';

// params: { search, status, priority, sort }; empty values are left out of the URL.
export async function getTasks(params) {
  const data = await apiRequest('/tasks', { params });
  return data.tasks;
}

export async function getTask(id) {
  const data = await apiRequest(`/tasks/${id}`);
  return data.task;
}

export async function createTask(task) {
  const data = await apiRequest('/tasks', { method: 'POST', body: task });
  return data.task;
}

// PUT is a full update, so send every field.
export async function updateTask(id, task) {
  const data = await apiRequest(`/tasks/${id}`, { method: 'PUT', body: task });
  return data.task;
}

export async function updateTaskStatus(id, status) {
  const data = await apiRequest(`/tasks/${id}/status`, { method: 'PATCH', body: { status } });
  return data.task;
}

export function deleteTask(id) {
  return apiRequest(`/tasks/${id}`, { method: 'DELETE' });
}

export function getStats() {
  return apiRequest('/tasks/stats');
}
