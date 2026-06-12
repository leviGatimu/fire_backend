import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createLogger, requestLogger, errorHandler, notFoundHandler } from '../packages/shared/src/index';

// Import Routers directly from services
import authRoutes from '../services/auth-service/src/routes/auth.routes';
import userRoutes from '../services/user-service/src/routes/user.routes';
import extinguisherRoutes from '../services/extinguisher-service/src/routes/extinguisher.routes';
import inspectionRoutes from '../services/inspection-service/src/routes/inspection.routes';
import maintenanceRoutes from '../services/maintenance-service/src/routes/maintenance.routes';
import reportRoutes from '../services/reporting-service/src/routes/report.routes';
import notificationRoutes from '../services/notification-service/src/routes/notification.routes';

const logger = createLogger('combined-api');
const app = express();

// Standard middleware
app.use(helmet());
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || true, 
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger(logger));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'combined-api' }));

// Mount routers at their respective prefixes
// These match the prefixes expected by the frontend and previously handled by the gateway.
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/extinguishers', extinguisherRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler(logger));

export default app;
