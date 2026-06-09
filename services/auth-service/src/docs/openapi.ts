import { OpenApiDoc, securitySchemes, commonResponses } from '@tzw/shared';

const authResult = {
  type: 'object',
  properties: {
    user: { $ref: '#/components/schemas/AuthUser' },
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' },
  },
};

export const openapi: OpenApiDoc = {
  openapi: '3.0.3',
  info: {
    title: 'TZW FEMS — Authentication Service',
    version: '1.0.0',
    description: 'Registration, login, JWT issuance/rotation, and password recovery.',
  },
  servers: [{ url: 'http://localhost:8080/api/auth', description: 'via gateway' }, { url: 'http://localhost:4001', description: 'direct' }],
  components: {
    securitySchemes,
    schemas: {
      AuthUser: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['ADMIN', 'INSPECTOR', 'USER'] },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password'],
        properties: {
          firstName: { type: 'string', example: 'Jane' },
          lastName: { type: 'string', example: 'Doe' },
          email: { type: 'string', format: 'email', example: 'jane@tzw.com' },
          password: { type: 'string', format: 'password', example: 'Passw0rd!' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'admin@tzw.com' },
          password: { type: 'string', example: 'Admin@1234' },
        },
      },
    },
  },
  paths: {
    '/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user (assigned USER role)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } } } },
        responses: {
          201: { description: 'Created', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: authResult } } } } },
          409: { description: 'Email already registered' },
          422: commonResponses.ValidationError,
        },
      },
    },
    '/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate and receive JWT pair',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } } },
        responses: {
          200: { description: 'OK', content: { 'application/json': { example: { success: true, data: { user: { id: 'uuid', email: 'admin@tzw.com', role: 'ADMIN' }, accessToken: 'jwt...', refreshToken: 'jwt...' } } } } },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/refresh': {
      post: { tags: ['Auth'], summary: 'Rotate refresh token for a new JWT pair', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { refreshToken: { type: 'string' } } } } } }, responses: { 200: { description: 'OK' }, 401: commonResponses.Unauthorized } },
    },
    '/logout': {
      post: { tags: ['Auth'], summary: 'Revoke a refresh token', responses: { 200: { description: 'OK' } } },
    },
    '/forgot-password': {
      post: { tags: ['Auth'], summary: 'Request a password reset token', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { email: { type: 'string' } } } } } }, responses: { 200: { description: 'OK (always, to prevent enumeration)' } } },
    },
    '/reset-password': {
      post: { tags: ['Auth'], summary: 'Reset password using a token', requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' }, password: { type: 'string' } } } } } }, responses: { 200: { description: 'OK' }, 404: commonResponses.NotFound } },
    },
    '/me': {
      get: { tags: ['Auth'], summary: 'Current authenticated identity', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' }, 401: commonResponses.Unauthorized } },
    },
  },
};
