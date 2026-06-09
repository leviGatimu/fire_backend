import { OpenApiDoc, securitySchemes, commonResponses } from '@tzw/shared';

export const openapi: OpenApiDoc = {
  openapi: '3.0.3',
  info: {
    title: 'TZW FEMS — Fire Extinguisher Service',
    version: '1.0.0',
    description: 'CRUD for fire extinguisher master data with filtering & pagination.',
  },
  servers: [{ url: 'http://localhost:8080/api/extinguishers', description: 'via gateway' }],
  components: {
    securitySchemes,
    schemas: {
      Extinguisher: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          serialNumber: { type: 'string', example: 'FE-1001' },
          location: { type: 'string', example: 'Building A — Floor 1 Lobby' },
          type: { type: 'string', enum: ['WATER', 'CO2', 'FOAM', 'DRY_CHEMICAL'] },
          size: { type: 'string', enum: ['LBS_2_5', 'LBS_5', 'LBS_9', 'LBS_12'] },
          installationDate: { type: 'string', format: 'date-time' },
          expiryDate: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['ACTIVE', 'DUE_FOR_INSPECTION', 'EXPIRED', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE'] },
        },
      },
      ExtinguisherInput: {
        type: 'object',
        required: ['serialNumber', 'location', 'type', 'size', 'installationDate', 'expiryDate'],
        properties: {
          serialNumber: { type: 'string', example: 'FE-2001' },
          location: { type: 'string', example: 'Warehouse B — Bay 4' },
          type: { type: 'string', enum: ['WATER', 'CO2', 'FOAM', 'DRY_CHEMICAL'] },
          size: { type: 'string', enum: ['LBS_2_5', 'LBS_5', 'LBS_9', 'LBS_12'] },
          installationDate: { type: 'string', format: 'date', example: '2025-01-15' },
          expiryDate: { type: 'string', format: 'date', example: '2030-01-15' },
          status: { type: 'string', enum: ['ACTIVE', 'DUE_FOR_INSPECTION', 'EXPIRED', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE'] },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/': {
      get: {
        tags: ['Extinguishers'],
        summary: 'List extinguishers (paginated, filterable)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'type', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'OK' }, 401: commonResponses.Unauthorized },
      },
      post: {
        tags: ['Extinguishers'],
        summary: 'Create extinguisher (ADMIN)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ExtinguisherInput' } } } },
        responses: { 201: { description: 'Created' }, 403: commonResponses.Forbidden, 409: { description: 'Serial number exists' }, 422: commonResponses.ValidationError },
      },
    },
    '/{id}': {
      get: { tags: ['Extinguishers'], summary: 'Get one', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' }, 404: commonResponses.NotFound } },
      put: { tags: ['Extinguishers'], summary: 'Update (ADMIN)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/ExtinguisherInput' } } } }, responses: { 200: { description: 'OK' }, 403: commonResponses.Forbidden, 404: commonResponses.NotFound } },
      delete: { tags: ['Extinguishers'], summary: 'Delete (ADMIN)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { 200: { description: 'OK' }, 403: commonResponses.Forbidden, 404: commonResponses.NotFound } },
    },
  },
};
