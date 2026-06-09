import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@tzw/shared';
import { authService } from '../services/auth.service';

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body.email, req.body.password);
    res.json({ success: true, data: result });
  },

  async refresh(req: Request, res: Response) {
    const result = await authService.refresh(req.body.refreshToken);
    res.json({ success: true, data: result });
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.body?.refreshToken ?? '');
    res.json({ success: true, data: { message: 'Logged out' } });
  },

  async forgotPassword(req: Request, res: Response) {
    const result = await authService.forgotPassword(req.body.email);
    res.json({ success: true, data: result });
  },

  async resetPassword(req: Request, res: Response) {
    const result = await authService.resetPassword(req.body.token, req.body.password);
    res.json({ success: true, data: result });
  },

  async me(req: AuthenticatedRequest, res: Response) {
    res.json({ success: true, data: { user: req.user } });
  },
};
