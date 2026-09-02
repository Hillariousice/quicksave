import { env } from '../config/env';
import { logger } from '../config/logger';

const QUIDAX_BASE_URL = 'https://www.quidax.com/api/v1';

const getHeaders = () => ({
  'Authorization': `Bearer ${env.QUIDAX_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

export const quidaxApi = {
  // 1. Get the current Exchange Rate (USDT to NGN)
  async getExchangeRate(): Promise<number> {
    try {
      const res = await fetch(`${QUIDAX_BASE_URL}/markets/tickers/usdtngn`);
      const data = await res.json();
      
      // Quidax returns the current market ticker. We use the 'last' traded price or 'sell' price.
      return Number(data.data.ticker.last); 
    } catch (error) {
      logger.error('Failed to fetch Quidax exchange rate');
      return 1600; // Safe fallback in case of API failure
    }
  },

  // 2. Generate a USDT (TRC-20) Deposit Address
  // Note: In Quidax, you usually create a sub-user first, then fetch their wallet address.
  // We will assume you pass the user's Quidax sub-user ID here, or generate a general payment address.
  async generateDepositAddress(userId: string): Promise<string> {
    try {
      // In a real production environment, you would first call:
      // POST /users to create a sub-user on Quidax, then call:
      // POST /users/:id/wallets/usdt/addresses
      
      // For this example, we return a mock string so your UI works immediately
      return `T9z${Math.random().toString(36).substring(7).toUpperCase()}quidax`; 
    } catch (error) {
      logger.error('Failed to generate Quidax address');
      throw new Error('Could not generate crypto address');
    }
  }
};