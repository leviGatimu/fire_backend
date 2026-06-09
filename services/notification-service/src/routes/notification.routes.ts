import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler, authenticate, validate, AuthenticatedRequest } from '@tzw/shared';
import { notificationService } from '../services/notification.service';

const router = Router();

// ── Internal endpoint: called service-to-service (not via the gateway). ──────
// In production this is network-restricted to the internal docker network.
const notifySchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    channel: z.enum(['EMAIL', 'IN_APP']).optional(),
    subject: z.string().min(1),
    body: z.string().min(1),
    metadata: z.any().optional(),
  }),
});
router.post('/internal/notify', validate(notifySchema), asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ success: true, data: await notificationService.notify(req.body) });
}));

// ── User-facing endpoints (authenticated). ──────────────────────────────────
router.use(authenticate);

router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: await notificationService.listForUser(req.user!.id) });
}));

router.patch('/:id/read', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: await notificationService.markRead(req.params.id, req.user!.id) });
}));

export default router;
