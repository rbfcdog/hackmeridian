// src/api/controllers/actions.controller.ts
import { Request, Response } from 'express';
import { StellarService } from '../services/stellar.service';
import { UserService } from '../services/user.service';
import { OperationService } from '../services/operation.service';
import { AuthService } from '../services/auth.service';



export class ActionsController {
  
  static async login(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: 'email is required' 
        });
      }

      const result = await AuthService.login(email);
      
      res.status(200).json({ 
        success: true, 
        sessionToken: result.sessionToken,
        userId: result.userId,
        publicKey: result.publicKey
      });

    } catch (error: any) {
      if (error.message.includes('não foi encontrado')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }
  
  static async createTestAccount(req: Request, res: Response) {
    try {
      const result = await StellarService.createTestAccount();
      res.status(201).json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async registerUser(req: Request, res: Response) {
    try {
      const { email, phone_number } = req.body;

      if (!email && !phone_number) {
        return res.status(400).json({ 
          success: false, 
          message: 'email or phone_number is required' 
        });
      }

      const { user, secret } = await UserService.registerUser({ email, phone_number });
      
      res.status(201).json({ 
        success: true, 
        user: user,
        secret: secret,
        WARNING: "Esta é a única vez que a chave secreta (secret) será exibida. Guarde-a em um local seguro e não a compartilhe com ninguém."
      });

    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async addContact(req: Request, res: Response) {
    try {
      const { contact_name, public_key } = req.body;
      const userId = req.user?.userId;

      if (!contact_name || !public_key) {
        return res.status(400).json({
          success: false,
          message: 'contact_name and public_key are required'
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const newContact = await UserService.addContact({ userId, contact_name, public_key });

      res.status(201).json({ success: true, contact: newContact });

    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message.includes('already exists')) {
        return res.status(409).json({ success: false, message: error.message });
      }
      
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async lookupContactByName(req: Request, res: Response) {
    try {
      const { contact_name } = req.body;
      const userId = req.user?.userId;

      if (!contact_name) {
        return res.status(400).json({ 
          success: false, 
          message: 'contact_name is required' 
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      
      const contact = await UserService.lookupContactByNameAndUserId({ userId, contact_name });

      res.status(200).json({ success: true, contact: contact });

    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      
      res.status(500).json({ success: false, message: error.message });
    }
  }
  static async listContacts(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      
      const contacts = await UserService.listContacts({ userId });

      res.status(200).json({ 
        success: true, 
        contacts: contacts,
        count: contacts.length 
      });

    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async buildPaymentXdr(req: Request, res: Response) {
    try {
      const { sourcePublicKey, destination, amount, assetCode, assetIssuer, memoText } = req.body;

      if (!sourcePublicKey || !destination || !amount) {
        return res.status(400).json({
          success: false,
          message: 'sourcePublicKey, destination, and amount are required'
        });
      }

      const xdr = await StellarService.buildPaymentXdr({
        sourcePublicKey,
        destination,
        amount,
        assetCode,
        assetIssuer,
        memoText
      });

      res.status(200).json({ 
        success: true, 
        xdr: xdr,
        message: 'Transaction XDR built successfully. Sign and submit externally.'
      });

    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async executePayment(req: Request, res: Response) {
    try {
      const { destination, amount, assetCode, assetIssuer, memoText, secretKey } = req.body;
      const userId = req.user?.userId;

      if (!destination || !amount || !secretKey) {
        return res.status(400).json({
          success: false,
          message: 'destination, amount, and secretKey are required'
        });
      }

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const result = await StellarService.executePayment({
        userId,
        destination,
        amount,
        assetCode,
        assetIssuer,
        memoText,
        secretKey
      });

      res.status(200).json({ 
        ...result 
      });

    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getOperationHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }
      
      const history = await OperationService.getOperationHistory(userId);

      res.status(200).json({ success: true, history: history });

    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

}