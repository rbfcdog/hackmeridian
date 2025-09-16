import { Router } from 'express';
import { ActionsController } from '../controllers/actions.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();


router.post('/login', ActionsController.login);

router.post('/create-test-account', ActionsController.createTestAccount);

router.post('/register-user-with-new-wallet', ActionsController.registerUserWithNewWallet);
router.post('/register-user-with-existing-wallet', ActionsController.registerUserWithExistingWallet);
router.post('/register-user', ActionsController.registerUser); // Legado - usa new wallet

router.use(authenticateToken);

router.post('/add-contact', ActionsController.addContact);
router.post('/lookup-contact-by-name', ActionsController.lookupContactByName);
router.post('/list-contacts', ActionsController.listContacts);

router.post('/build-payment-xdr', ActionsController.buildPaymentXdr);
router.post('/execute-payment', ActionsController.executePayment);

router.post('/get-operation-history', ActionsController.getOperationHistory);

export default router;