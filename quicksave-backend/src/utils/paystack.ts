import { env } from '../config/env';
import { logger } from '../config/logger';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const getHeaders = () => ({
  Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

export const paystack = {
  // 1. Initialize a Deposit (Gets the payment link for the mobile app)
  async initializeTransaction(email: string, amountInNaira: number, userId: string) {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        email,
        amount: amountInNaira * 100, // Paystack expects Kobo (lowest denomination)
        metadata: { userId }, // We pass userId so the Webhook knows who to fund!
      }),
    });
    
    const data = await response.json() as any;
    if (!data.status) throw new Error(data.message);
    return data.data; // contains authorization_url and reference
  },

  // 2. Create a Transfer Recipient (Required before sending money out)
  async createTransferRecipient(name: string, accountNumber: string, bankCode: string) {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transferrecipient`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        type: 'nuban',
        name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
      }),
    });

    const data = await response.json() as any;
    if (!data.status) throw new Error(data.message);
    return data.data.recipient_code;
  },

  // 3. Initiate the Actual Transfer
  async initiateTransfer(amountInNaira: number, recipientCode: string, reference: string, reason: string) {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        source: 'balance',
        amount: amountInNaira * 100,
        recipient: recipientCode,
        reference,
        reason,
      }),
    });

    const data = await response.json() as any;
    if (!data.status) throw new Error(data.message);
    return data.data;
  }
};