import { OpenApiDoc, securitySchemes, commonResponses } from '@tzw/shared';

export const openapi: OpenApiDoc = {
  openapi: '3.0.3',
  info: { title: 'TZW FEMS — Reporting Service', version: '1.0.0', description: 'Dashboard statistics and PDF/Excel exports.' },
  servers: [{ url: 'http://localhost:8080/api/reports', description: 'via gateway' }],
  components: { securitySchemes },
  security: [{ bearerAuth: [] }],
  paths: {
    '/summary': { get: { tags: ['Reports'], summary: 'Dashboard summary (cards + charts)', responses: { 200: { description: 'OK', content: { 'application/json': { example: { success: true, data: { cards: { totalExtinguishers: 5, active: 2, expired: 1 }, charts: { byType: [{ label: 'CO2', value: 2 }], byStatus: [] } } } } } }, 401: commonResponses.Unauthorized } } },
    '/monthly': { get: { tags: ['Reports'], summary: 'Monthly inspections/maintenance', parameters: [{ name: 'year', in: 'query', schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } } },
    '/yearly': { get: { tags: ['Reports'], summary: 'Yearly installations', responses: { 200: { description: 'OK' } } } },
    '/export/pdf': { get: { tags: ['Reports'], summary: 'Export PDF (ADMIN)', responses: { 200: { description: 'PDF', content: { 'application/pdf': {} } }, 403: commonResponses.Forbidden } } },
    '/export/excel': { get: { tags: ['Reports'], summary: 'Export Excel (ADMIN)', responses: { 200: { description: 'XLSX' }, 403: commonResponses.Forbidden } } },
  },
};
