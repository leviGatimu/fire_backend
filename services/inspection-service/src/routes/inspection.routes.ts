import { Router, Request, Response } from 'express';
import { asyncHandler, validate, authenticate, authorize } from '@tzw/shared';
import { inspectionService } from '../services/inspection.service';
import { createSchema, updateSchema, completeSchema, idSchema, listSchema } from '../validators/inspection.schema';

const router = Router();
router.use(authenticate);

router.get('/', validate(listSchema), asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, ...(await inspectionService.list(req.query as any)) });
}));

router.get('/:id', validate(idSchema), asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await inspectionService.getById(req.params.id) });
}));

// Scheduling/edits — ADMIN or INSPECTOR.
router.post('/', authorize('ADMIN', 'INSPECTOR'), validate(createSchema), asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ success: true, data: await inspectionService.create(req.body) });
}));

router.put('/:id', authorize('ADMIN', 'INSPECTOR'), validate(updateSchema), asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await inspectionService.update(req.params.id, req.body) });
}));

router.patch('/:id/cancel', authorize('ADMIN', 'INSPECTOR'), validate(idSchema), asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await inspectionService.cancel(req.params.id) });
}));

router.patch('/:id/complete', authorize('ADMIN', 'INSPECTOR'), validate(completeSchema), asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await inspectionService.complete(req.params.id, req.body?.notes) });
}));

export default router;
