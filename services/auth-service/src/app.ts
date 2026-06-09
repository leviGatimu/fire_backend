import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import {
  createLogger,
  requestLogger,
  errorHandler,
  notFoundHandler,
  mountSwagger,
} from '@tzw/shared';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import { openapi } from './docs/openapi';

export const logger = createLogger(config.serviceName);

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestLogger(logger));

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: config.serviceName }));
  mountSwagger(app, openapi);

  app.use('/api/auth', authRoutes);
  // Also mount at root so the gateway can strip the prefix transparently.
  app.use('/', authRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler(logger));
  return app;
}
