
import { Router } from 'express';
import { ActionsController } from '../controllers/actions.controller';

const router = Router();

router.post('/create-test-account', ActionsController.createTestAccount);

export default router;