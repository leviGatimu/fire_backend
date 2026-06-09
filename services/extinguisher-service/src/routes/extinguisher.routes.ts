import { Router } from 'express';
import { asyncHandler, validate, authenticate, authorize } from '@tzw/shared';
import { extinguisherController } from '../controllers/extinguisher.controller';
import { createSchema, updateSchema, idSchema, listSchema } from '../validators/extinguisher.schema';

const router = Router();

// All routes require a valid token (zero-trust at the service boundary).
router.use(authenticate);

// Reads — any authenticated role.
router.get('/', validate(listSchema), asyncHandler(extinguisherController.list));
router.get('/:id', validate(idSchema), asyncHandler(extinguisherController.getById));

// Writes — ADMIN only (extinguisher master data is administrative).
router.post('/', authorize('ADMIN'), validate(createSchema), asyncHandler(extinguisherController.create));
router.put('/:id', authorize('ADMIN'), validate(updateSchema), asyncHandler(extinguisherController.update));
router.delete('/:id', authorize('ADMIN'), validate(idSchema), asyncHandler(extinguisherController.remove));

export default router;
