import { OpenApiDoc, securitySchemes, commonResponses } from '@tzw/shared';

export const openapi: OpenApiDoc = {
  openapi: '3.0.3',
  info: { title: 'TZW FEMS — Notification Service', version: '1.0.0', description: 'In-app & email notifications.' },
  servers: [{ url: 'http://localhost:8080/api/notifications', description: 'via gateway' }],
  components: { securitySchemes },
  paths: {
    '/': { get: { tags: ['Notifications'], summary: 'My notifications', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' }, 401: commonResponses.Unauthorized } } },
    '/{id}/read': { patch: { tags: ['Notifications'], summary: 'Mark as read', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } } },
    '/internal/notify': { post: { tags: ['Internal'], summary: 'Create a notification (service-to-service only)', responses: { 201: { description: 'Created' } } } },
  },
};
