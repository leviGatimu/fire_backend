import { OpenApiDoc, securitySchemes, commonResponses } from '@tzw/shared';

export const openapi: OpenApiDoc = {
  openapi: '3.0.3',
  info: { title: 'TZW FEMS — Inspection Service', version: '1.0.0', description: 'Schedule, update, cancel and complete inspections.' },
  servers: [{ url: 'http://localhost:8080/api/inspections', description: 'via gateway' }],
  components: {
    securitySchemes,
    schemas: {
      InspectionInput: {
        type: 'object',
        required: ['extinguisherId', 'inspectorId', 'scheduledAt'],
        properties: {
          extinguisherId: { type: 'string', format: 'uuid' },
          inspectorId: { type: 'string', format: 'uuid' },
          scheduledAt: { type: 'string', format: 'date-time', example: '2026-07-01T09:30:00Z' },
          notes: { type: 'string' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/': {
      get: { tags: ['Inspections'], summary: 'List inspections', responses: { 200: { description: 'OK' }, 401: commonResponses.Unauthorized } },
      post: { tags: ['Inspections'], summary: 'Schedule inspection (ADMIN/INSPECTOR)', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/InspectionInput' } } } }, responses: { 201: { description: 'Created' }, 403: commonResponses.Forbidden } },
    },
    '/{id}': {
      get: { tags: ['Inspections'], summary: 'Get one', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' }, 404: commonResponses.NotFound } },
      put: { tags: ['Inspections'], summary: 'Update (reschedule/reassign)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
    '/{id}/cancel': { patch: { tags: ['Inspections'], summary: 'Cancel inspection', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } } },
    '/{id}/complete': { patch: { tags: ['Inspections'], summary: 'Complete inspection', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } } },
  },
};
