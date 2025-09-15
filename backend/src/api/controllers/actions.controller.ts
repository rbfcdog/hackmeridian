import { Request, Response } from 'express';
import { StellarService } from '../services/stellar.service';

export class ActionsController {
  static async createTestAccount(req: Request, res: Response) {
    try {
      const result = await StellarService.createTestAccount();
      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}