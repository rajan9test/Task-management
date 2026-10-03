import { Router } from 'express';
import * as taskController from '../controllers/taskController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  taskIdParamSchema,
  createTaskSchema,
  updateTaskSchema,
  statusSchema,
  listTasksQuerySchema,
} from '../validators/taskValidators.js';

export const taskRoutes = Router();

taskRoutes.use(requireAuth);

const validId = validate(taskIdParamSchema, 'params');

taskRoutes.get('/', validate(listTasksQuerySchema, 'query'), taskController.list);
// Must come before '/:id', otherwise "stats" would be treated as an id.
taskRoutes.get('/stats', taskController.stats);
taskRoutes.get('/:id', validId, taskController.getOne);
taskRoutes.post('/', validate(createTaskSchema), taskController.create);
taskRoutes.put('/:id', validId, validate(updateTaskSchema), taskController.update);
taskRoutes.patch('/:id/status', validId, validate(statusSchema), taskController.updateStatus);
taskRoutes.delete('/:id', validId, taskController.remove);
