import * as taskService from '../services/taskService.js';
import { sendSuccess } from '../utils/response.js';

export async function list(req, res) {
  const tasks = await taskService.listTasks(req.user.id, req.validated.query);
  sendSuccess(res, 200, 'Tasks fetched', { tasks });
}

export async function stats(req, res) {
  const stats = await taskService.getStats(req.user.id);
  sendSuccess(res, 200, 'Stats fetched', stats);
}

export async function getOne(req, res) {
  const task = await taskService.getTask(req.validated.params.id, req.user.id);
  sendSuccess(res, 200, 'Task fetched', { task });
}

export async function create(req, res) {
  const task = await taskService.createTask(req.user.id, req.validated.body);
  sendSuccess(res, 201, 'Task created successfully', { task });
}

export async function update(req, res) {
  const task = await taskService.updateTask(req.validated.params.id, req.user.id, req.validated.body);
  sendSuccess(res, 200, 'Task updated successfully', { task });
}

export async function updateStatus(req, res) {
  const task = await taskService.updateTaskStatus(req.validated.params.id, req.user.id, req.validated.body.status);
  sendSuccess(res, 200, 'Task status updated', { task });
}

export async function remove(req, res) {
  await taskService.deleteTask(req.validated.params.id, req.user.id);
  sendSuccess(res, 200, 'Task deleted successfully', null);
}
