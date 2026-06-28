import { Response, NextFunction } from 'express';
import { billService } from './service.js';
import { createBillSchema } from './validator.js';
import { AuthenticatedRequest } from '../../shared/middleware/auth.js';

export class BillController {
  async createBill(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createBillSchema.parse(req.body);
      const bill = await billService.createBill(validated);

      res.status(201).json({
        success: true,
        message: 'Bill invoice created successfully. PDF generation queued.',
        data: bill,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  async payBill(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const bill = await billService.payBill(id);

      res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        data: bill,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

export const billController = new BillController();
