import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

export interface OpenApiDoc {
  openapi: string;
  info: { title: string; version: string; description?: string };
  servers?: { url: string; description?: string }[];
  paths: Record<string, unknown>;
  components?: Record<string, unknown>;
  [k: string]: unknown;
}

/** Reusable OpenAPI building blocks shared by every service document. */
export const securitySchemes = {
  bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
};

export const commonResponses = {
  Unauthorized: {
    description: 'Authentication required',
    content: { 'application/json': { example: { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } } } },
  },
  Forbidden: {
    description: 'Insufficient permissions',
    content: { 'application/json': { example: { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } } } },
  },
  NotFound: {
    description: 'Resource not found',
    content: { 'application/json': { example: { success: false, error: { code: 'NOT_FOUND', message: 'Resource not found' } } } },
  },
  ValidationError: {
    description: 'Validation failed',
    content: { 'application/json': { example: { success: false, error: { code: 'VALIDATION_ERROR', message: 'Validation failed' } } } },
  },
};

export function mountSwagger(app: Express, doc: OpenApiDoc, path = '/docs') {
  app.get(`${path}.json`, (_req, res) => res.json(doc));
  app.use(path, swaggerUi.serve, swaggerUi.setup(doc, { customSiteTitle: doc.info.title }));
}
