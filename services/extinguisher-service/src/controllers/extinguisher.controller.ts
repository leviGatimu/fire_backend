import { Request, Response } from 'express';
import { extinguisherService } from '../services/extinguisher.service';

export const extinguisherController = {
  async create(req: Request, res: Response) {
    const item = await extinguisherService.create(req.body);
    res.status(201).json({ success: true, data: item });
  },
  async list(req: Request, res: Response) {
    const result = await extinguisherService.list(req.query as any);
    res.json({ success: true, ...result });
  },
  async getById(req: Request, res: Response) {
    const item = await extinguisherService.getById(req.params.id);
    res.json({ success: true, data: item });
  },
  async update(req: Request, res: Response) {
    const item = await extinguisherService.update(req.params.id, req.body);
    res.json({ success: true, data: item });
  },
  async remove(req: Request, res: Response) {
    const result = await extinguisherService.remove(req.params.id);
    res.json({ success: true, data: result });
  },
};
