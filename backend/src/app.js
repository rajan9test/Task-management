import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { authRoutes } from './routes/authRoutes.js';
import { taskRoutes } from './routes/taskRoutes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'OK' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

app.use(notFound);
app.use(errorHandler);
