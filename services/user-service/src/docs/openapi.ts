import { OpenApiDoc, securitySchemes, commonResponses } from '@tzw/shared';

export const openapi: OpenApiDoc = {
  openapi: '3.0.3',
  info: { title: 'TZW FEMS — User Service', version: '1.0.0', description: 'User & role management, profile, change password.' },
  servers: [{ url: 'http://localhost:8080/api/users', description: 'via gateway' }],
  components: {
    securitySchemes,
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' }, firstName: { type: 'string' }, lastName: { type: 'string' },
          email: { type: 'string' }, phone: { type: 'string', nullable: true }, isActive: { type: 'boolean' },
          role: { type: 'object', properties: { name: { type: 'string' } } },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/me/profile': {
      get: { tags: ['Profile'], summary: 'Get my profile', responses: { 200: { description: 'OK' }, 401: commonResponses.Unauthorized } },
      patch: { tags: ['Profile'], summary: 'Update my profile', responses: { 200: { description: 'OK' } } },
    },
    '/me/password': { patch: { tags: ['Profile'], summary: 'Change my password', responses: { 200: { description: 'OK' }, 401: commonResponses.Unauthorized } } },
    '/roles': { get: { tags: ['Users'], summary: 'List roles', responses: { 200: { description: 'OK' } } } },
    '/': {
      get: { tags: ['Users'], summary: 'List users (ADMIN)', responses: { 200: { description: 'OK' }, 403: commonResponses.Forbidden } },
      post: { tags: ['Users'], summary: 'Create user (ADMIN)', responses: { 201: { description: 'Created' }, 403: commonResponses.Forbidden } },
    },
    '/{id}': {
      get: { tags: ['Users'], summary: 'Get user (ADMIN)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' }, 404: commonResponses.NotFound } },
      put: { tags: ['Users'], summary: 'Update user (ADMIN)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Users'], summary: 'Delete user (ADMIN)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } },
    },
  },
};
