import { OpenApiDoc, securitySchemes, commonResponses } from '@tzw/shared';

export const openapi: OpenApiDoc = {
  openapi: '3.0.3',
  info: { title: 'TZW FEMS — Maintenance Service', version: '1.0.0', description: 'Maintenance logs, history and CSV export.' },
  servers: [{ url: 'http://localhost:8080/api/maintenance', description: 'via gateway' }],
  components: {
    securitySchemes,
    schemas: {
      MaintenanceInput: {
        type: 'object',
        required: ['extinguisherId', 'actionTaken', 'actionDate'],
        properties: {
          extinguisherId: { type: 'string', format: 'uuid' },
          actionTaken: { type: 'string', example: 'Replaced pressure gauge' },
          actionDate: { type: 'string', format: 'date', example: '2026-06-01' },
          conditionNotes: { type: 'string' },
          recommendations: { type: 'string' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/': {
      get: { tags: ['Maintenance'], summary: 'List maintenance logs', responses: { 200: { description: 'OK' }, 401: commonResponses.Unauthorized } },
      post: { tags: ['Maintenance'], summary: 'Create log (ADMIN/INSPECTOR)', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/MaintenanceInput' } } } }, responses: { 201: { description: 'Created' }, 403: commonResponses.Forbidden } },
    },
    '/{id}': {
      get: { tags: ['Maintenance'], summary: 'Get one', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' }, 404: commonResponses.NotFound } },
      put: { tags: ['Maintenance'], summary: 'Update log', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
    '/history/{extinguisherId}': { get: { tags: ['Maintenance'], summary: 'Full history for an extinguisher', parameters: [{ name: 'extinguisherId', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } } },
    '/export': { get: { tags: ['Maintenance'], summary: 'Export logs as CSV', responses: { 200: { description: 'CSV file', content: { 'text/csv': {} } } } } },
  },
};
