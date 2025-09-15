// src/api/controllers/actions.controller.ts
import { Request, Response } from 'express';
import { StellarService } from '../services/stellar.service';
import { UserService } from '../services/user.service';
import { OperationService } from '../services/operation.service';



export class ActionsController {
  
  // Rota: POST /api/actions/create-test-account
  static async createTestAccount(req: Request, res: Response) {
    try {
      const result = await StellarService.createTestAccount();
      res.status(201).json({ success: true, ...result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

    // Rota: POST /api/actions/register-user
  static async registerUser(req: Request, res: Response) {
    try {
      const { email, phone_number } = req.body;

      // Validação: Exige que pelo menos um dos campos seja fornecido
      if (!email && !phone_number) {
        return res.status(400).json({ 
          success: false, 
          message: 'email or phone_number is required' 
        });
      }

      // Chama o serviço, que agora faz todo o trabalho pesado
      const { user, secret } = await UserService.registerUser({ email, phone_number });
      
      // Retorna a resposta com sucesso, incluindo a chave secreta e um aviso
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
      const { user_email, contact_email, contact_name } = req.body;

      // Validação básica da entrada
      if (!user_email || !contact_email || !contact_name) {
        return res.status(400).json({ 
          success: false, 
          message: 'user_email, contact_email, and contact_name are required' 
        });
      }
      
      const newContact = await UserService.addContact({ user_email, contact_email, contact_name });

      res.status(201).json({ success: true, contact: newContact });

    } catch (error: any) {
      // Retorna erros específicos para o cliente
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message.includes('already exists')) {
        return res.status(409).json({ success: false, message: error.message }); // 409 Conflict
      }
      
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async lookupContactByName(req: Request, res: Response) {
    try {
      const { user_email, contact_name } = req.body;

      // Validação da entrada
      if (!user_email || !contact_name) {
        return res.status(400).json({ 
          success: false, 
          message: 'user_email and contact_name are required' 
        });
      }
      
      const contact = await UserService.lookupContactByName({ user_email, contact_name });

      res.status(200).json({ success: true, contact: contact });

    } catch (error: any) {
      // Se o serviço lançar um erro de 'not found', o controller retorna 404
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getOperationHistory(req: Request, res: Response) { // 2. ADICIONAR NOVO MÉTODO
    try {
      const { user_id } = req.body;

      if (!user_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'user_id is required' 
        });
      }
      
      const history = await OperationService.getOperationHistory(user_id);

      res.status(200).json({ success: true, history: history });

    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}