import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1, 'Email is required').email('Not a valid email'),
  }),
});

export const onboardUserSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    phoneNumber: z.string().optional(),
    publicKey: z.string().length(56, 'Invalid public key format').optional(),
  }).refine(
    (data) => data.email || data.phoneNumber,
    {
      message: 'Either email or phoneNumber is required',
      path: ['email'],
    }
  ),
});

export const addContactSchema = z.object({
  body: z.object({
    contact_name: z.string().min(1, 'Contact name is required'),
    public_key: z.string().min(1, 'Public key is required').length(56, 'Invalid public key format'),
  }),
});

export const lookupContactByNameSchema = z.object({
  body: z.object({
    contact_name: z.string().min(1, 'Contact name is required'),
  }),
});

export const buildPaymentXdrSchema = z.object({
  body: z.object({
    sourcePublicKey: z.string().min(1, 'Source public key is required').length(56, 'Invalid public key format'),
    destination: z.string().min(1, 'Destination is required').length(56, 'Invalid public key format'),
    amount: z.string().min(1, 'Amount is required'),
    assetCode: z.string().optional(),
    assetIssuer: z.string().length(56, 'Invalid asset issuer public key format').optional(),
    memoText: z.string().max(28, 'Memo text is too long').optional(),
  }),
});

export const executePaymentSchema = z.object({
  body: z.object({
    destination: z.string().min(1, 'Destination is required').length(56, 'Invalid public key format'),
    amount: z.string().min(1, 'Amount is required'),
    secretKey: z.string().min(1, 'Secret key is required'),
    assetCode: z.string().optional(),
    assetIssuer: z.string().length(56, 'Invalid asset issuer public key format').optional(),
    memoText: z.string().max(28, 'Memo text is too long').optional(),
  }),
});

export const listContactsSchema = z.object({
  body: z.object({}).optional(),
});

export const getOperationHistorySchema = z.object({
  body: z.object({}).optional(),
});

export const getAccountBalanceSchema = z.object({
  body: z.object({
    publicKey: z.string().length(56, 'Formato de chave pública Stellar inválido.'),
  }),
});

export const buildPathPaymentXdrSchema = z.object({
  body: z.object({
    sourcePublicKey: z.string().min(1, 'Source public key is required').length(56, 'Invalid public key format'),
    destination: z.string().min(1, 'Destination is required').length(56, 'Invalid public key format'),
    destAsset: z.object({
      code: z.string().min(1, 'Destination asset code is required'),
      issuer: z.string().length(56, 'Invalid destination asset issuer public key format'),
    }),
    destAmount: z.string().min(1, 'Destination amount is required'),
    sourceAsset: z.object({
      code: z.string().min(1, 'Source asset code is required'),
      issuer: z.string().length(56, 'Invalid source asset issuer public key format'),
    }),
  }),
});

export const executePathPaymentSchema = z.object({
  body: z.object({
    destination: z.string().min(1, 'Destination is required').length(56, 'Invalid public key format'),
    destAsset: z.object({
      code: z.string().min(1, 'Destination asset code is required'),
      issuer: z.string().length(56, 'Invalid destination asset issuer public key format'),
    }),
    destAmount: z.string().min(1, 'Destination amount is required'),
    sourceAsset: z.object({
      code: z.string().min(1, 'Source asset code is required'),
      issuer: z.string().length(56, 'Invalid source asset issuer public key format'),
    }),
    secretKey: z.string().min(1, 'Secret key is required'),
  }),
});

export const initiatePixDepositSchema = z.object({
  body: z.object({
    publicKey: z.string().min(1, 'Public key is required').length(56, 'Invalid public key format'),
    assetCode: z.string().min(1, 'Asset code is required'),
    amount: z.string().min(1, 'Amount is required').regex(/^\d+(\.\d+)?$/, 'Amount must be a valid number'),
  }),
});

export const checkDepositStatusSchema = z.object({
  body: z.object({
    operationId: z.string().min(1, 'Operation ID is required'),
  }),
});
