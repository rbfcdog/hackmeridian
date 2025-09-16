import { Router } from 'express';
import { ActionsController } from '../controllers/actions.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { 
  loginSchema, 
  registerUserWithNewWalletSchema,
  registerUserWithExistingWalletSchema,
  registerUserSchema,
  addContactSchema,
  lookupContactByNameSchema,
  listContactsSchema,
  buildPaymentXdrSchema,
  executePaymentSchema,
  getOperationHistorySchema,
  createTestAccountSchema
} from '../dtos/actions.dto';

const router = Router();

router.post('/login', validate(loginSchema), ActionsController.login);

router.post('/create-test-account', validate(createTestAccountSchema), ActionsController.createTestAccount);

router.post('/register-user-with-new-wallet', validate(registerUserWithNewWalletSchema), ActionsController.registerUserWithNewWallet);
router.post('/register-user-with-existing-wallet', validate(registerUserWithExistingWalletSchema), ActionsController.registerUserWithExistingWallet);
router.post('/register-user', validate(registerUserSchema), ActionsController.registerUser); // Legado - usa new wallet

router.use(authenticateToken);

router.post('/add-contact', validate(addContactSchema), ActionsController.addContact);
router.post('/lookup-contact-by-name', validate(lookupContactByNameSchema), ActionsController.lookupContactByName);
router.post('/list-contacts', validate(listContactsSchema), ActionsController.listContacts);

router.post('/build-payment-xdr', validate(buildPaymentXdrSchema), ActionsController.buildPaymentXdr);
router.post('/execute-payment', validate(executePaymentSchema), ActionsController.executePayment);

router.post('/get-operation-history', validate(getOperationHistorySchema), ActionsController.getOperationHistory);

export default router;