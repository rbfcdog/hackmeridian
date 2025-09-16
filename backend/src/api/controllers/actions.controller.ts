import { Request, Response } from 'express';
import { StellarService } from '../services/stellar.service';
import { UserService } from '../services/user.service';
import { OperationService } from '../services/operation.service';
import { AuthService } from '../services/auth.service';

// Interface local para garantir tipagem
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

export class ActionsController {
  
  static async login(req: Request, res: Response) {
    try {
      const { email } = req.body;
      
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
  
  static async onboardUser(req: Request, res: Response) {
    try {
      const result = await UserService.onboardUser(req.body);
      
      res.status(201).json({ 
        success: true, 
        ...result,
        message: "User onboarded successfully"
      });

    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async addContact(req: AuthenticatedRequest, res: Response) {
    try {
      const { contact_name, public_key } = req.body;
      const userId = (req as AuthenticatedRequest).user?.userId;

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

  static async lookupContactByName(req: AuthenticatedRequest, res: Response) {
    try {
      const { contact_name } = req.body;
      const userId = req.user?.userId;

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
  static async listContacts(req: AuthenticatedRequest, res: Response) {
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

  static async executePayment(req: AuthenticatedRequest, res: Response) {
    try {
      const { destination, amount, assetCode, assetIssuer, memoText, secretKey } = req.body;
      const userId = req.user?.userId;

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

  static async getOperationHistory(req: AuthenticatedRequest, res: Response) {
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

  static async buildPathPaymentXdr(req: Request, res: Response) {
    try {
      const { sourcePublicKey, destination, destAsset, destAmount, sourceAsset } = req.body;

      const xdr = await StellarService.buildPathPaymentXdr({
        sourcePublicKey,
        destination,
        destAsset,
        destAmount,
        sourceAsset
      });

      res.status(200).json({ 
        success: true, 
        xdr: xdr,
        message: 'Path payment XDR built successfully. Sign and submit externally.'
      });

    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async executePathPayment(req: AuthenticatedRequest, res: Response) {
    try {
      const { destination, destAsset, destAmount, sourceAsset, secretKey } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      const result = await StellarService.executePathPayment({
        userId,
        destination,
        destAsset,
        destAmount,
        sourceAsset,
        secretKey
      });

      res.status(200).json({ 
        ...result 
      });

    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

}