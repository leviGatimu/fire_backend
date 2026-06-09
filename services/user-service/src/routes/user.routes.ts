import { Router, Request, Response } from 'express';
import { asyncHandler, validate, authenticate, authorize, AuthenticatedRequest } from '@tzw/shared';
import { userService } from '../services/user.service';
import {
  listSchema,
  idSchema,
  createSchema,
  updateUserSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/user.schema';

const router = Router();
router.use(authenticate);

// ── Self-service profile (any authenticated user) ──────────────────────────
router.get('/me/profile', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: await userService.getById(req.user!.id) });
}));

router.patch('/me/profile', validate(updateProfileSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: await userService.updateProfile(req.user!.id, req.body) });
}));

router.patch('/me/password', validate(changePasswordSchema), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: await userService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword) });
}));

router.get('/roles', asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: await userService.listRoles() });
}));

// ── User administration (ADMIN only) ───────────────────────────────────────
router.get('/', authorize('ADMIN'), validate(listSchema), asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, ...(await userService.list(req.query as any)) });
}));

router.post('/', authorize('ADMIN'), validate(createSchema), asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ success: true, data: await userService.create(req.body) });
}));

router.get('/:id', authorize('ADMIN'), validate(idSchema), asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await userService.getById(req.params.id) });
}));

router.put('/:id', authorize('ADMIN'), validate(updateUserSchema), asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await userService.update(req.params.id, req.body) });
}));

router.delete('/:id', authorize('ADMIN'), validate(idSchema), asyncHandler(async (req: Request, res: Response) => {
  res.json({ success: true, data: await userService.remove(req.params.id) });
}));

export default router;
