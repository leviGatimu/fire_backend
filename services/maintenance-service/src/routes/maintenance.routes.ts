import { Router, Request, Response } from 'express';
import { asyncHandler, validate, authenticate, authorize, AuthenticatedRequest } from '@tzw/shared';
import { maintenanceService } from '../services/maintenance.service';
import { createSchema, updateSchema, idSchema, listSchema } from '../validators/maintenance.schema';

const router = Router();
router.use(authenticate);

// Export must precede '/:id' so "export" is not treated as an id.
router.get('/export', authorize('ADMIN', 'INSPECTOR'), asyncHandler(async (req: Request, res: Response) => {
  const csv = await maintenanceService.exportCsv(req.query.extinguisherId as string | undefined);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="maintenance-report.csv"');
  res.send(csv);
}));

router.get('/history/:extinguisherId', asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await maintenanceService.historyFor(req.params.extinguisherId) });
}));

router.get('/', validate(listSchema), asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, ...(await maintenanceService.list(req.query as any)) });
}));

router.get('/:id', validate(idSchema), asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await maintenanceService.getById(req.params.id) });
}));

// Only inspectors/admins log and edit maintenance.
router.post('/', authorize('ADMIN', 'INSPECTOR'), validate(createSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.status(201).json({ success: true, data: await maintenanceService.create(req.user!.id, req.body) });
}));

router.put('/:id', authorize('ADMIN', 'INSPECTOR'), validate(updateSchema), asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await maintenanceService.update(req.params.id, req.body) });
}));

export default router;
