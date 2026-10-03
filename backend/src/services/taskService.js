import { ApiError } from '../utils/ApiError.js';
import * as taskRepository from '../repositories/taskRepository.js';

// Another user's task gives the same 404 as a missing one, so task ids can't be probed.
function notFound() {
  return new ApiError(404, 'Task not found');
}

export function listTasks(userId, filters) {
  return taskRepository.findAll(userId, filters);
}

export function getStats(userId) {
  return taskRepository.getStats(userId);
}

export async function getTask(id, userId) {
  const task = await taskRepository.findById(id, userId);
  if (!task) throw notFound();
  return task;
}

export function createTask(userId, data) {
  return taskRepository.create(userId, data);
}

export async function updateTask(id, userId, data) {
  const task = await taskRepository.update(id, userId, data);
  if (!task) throw notFound();
  return task;
}

export async function updateTaskStatus(id, userId, status) {
  const task = await taskRepository.updateStatus(id, userId, status);
  if (!task) throw notFound();
  return task;
}

export async function deleteTask(id, userId) {
  const deleted = await taskRepository.remove(id, userId);
  if (!deleted) throw notFound();
}
