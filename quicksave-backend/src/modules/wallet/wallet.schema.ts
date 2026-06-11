import { z } from 'zod';

export const fundWalletSchema = z.object({
  body: z.object({
    amount: z.number().min(100, 'Minimum funding amount is ₦100'),
  }),
});

export const withdrawSchema = z.object({
  body: z.object({
    amount: z.number().min(500, 'Minimum withdrawal is ₦500'),
    accountNumber: z.string().length(10, 'Account number must be 10 digits'),
    bankCode: z.string().min(3, 'Invalid bank code'),
    accountName: z.string().min(2, 'Account name is required'),
  }),
});