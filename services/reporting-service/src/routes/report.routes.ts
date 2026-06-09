import { Router, Request, Response } from 'express';
import { asyncHandler, authenticate, authorize } from '@tzw/shared';
import { reportService } from '../services/report.service';
import { exportService } from '../services/export.service';

const router = Router();
router.use(authenticate);

router.get('/summary', asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await reportService.summary() });
}));

router.get('/monthly', asyncHandler(async (req: Request, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  res.json({ success: true, data: await reportService.monthly(year) });
}));

router.get('/yearly', asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await reportService.yearly() });
}));

// Exports — ADMIN only.
router.get('/export/pdf', authorize('ADMIN'), asyncHandler(async (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="fems-report.pdf"');
  await exportService.pdf(res);
}));

router.get('/export/excel', authorize('ADMIN'), asyncHandler(async (_req: Request, res: Response) => {
  const buffer = await exportService.excel();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="fems-inventory.xlsx"');
  res.send(Buffer.from(buffer));
}));

export default router;
