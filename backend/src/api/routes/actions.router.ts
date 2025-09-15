// src/api/routes/actions.router.ts
import { Router } from 'express';
import { ActionsController } from '../controllers/actions.controller';

const router = Router();

// Endpoint para criar uma conta de teste na Stellar
router.post('/create-test-account', ActionsController.createTestAccount);

// Endpoint para registrar um novo usuário no nosso sistema
router.post('/register-user', ActionsController.registerUser);

// Endpoint para adicionar um novo contato
router.post('/add-contact', ActionsController.addContact);

// Endpoint para buscar um contato pelo nome
router.post('/lookup-contact-by-name', ActionsController.lookupContactByName);

// Endpoint para buscar o histórico de operações de um usuário
router.post('/get-operation-history', ActionsController.getOperationHistory);

export default router;