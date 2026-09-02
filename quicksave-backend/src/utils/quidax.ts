import { env } from '../config/env';
import { logger } from '../config/logger';

const QUIDAX_BASE_URL = 'https://www.quidax.com/api/v1';

// Define the interface for the Quidax API response
interface QuidaxTickerResponse {
  status: string;
  message: string;
  data: {
    ticker: {
      buy: string;
      sell: string;
      low: string;
      high: string;
      last: string;
      vol: string;
    };
  };
}

const getHeaders = () => ({
  'Authorization': `Bearer ${env.QUIDAX_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

export const quidaxApi = {
  // 1. Get the current Exchange Rate (USDT to NGN)
  async getExchangeRate(): Promise<number> {
    try {
      const res = await fetch(`${QUIDAX_BASE_URL}/markets/tickers/usdtngn`);
      
      // FIX: Cast the JSON response to our Interface
      const data = (await res.json()) as QuidaxTickerResponse;
      
      // Now TypeScript knows data.data.ticker exists
      if (data && data.data && data.data.ticker) {
        return Number(data.data.ticker.last); 
      }
      
      throw new Error('Invalid response structure');
    } catch (error) {
      logger.error('Failed to fetch Quidax exchange rate', error);
      return 1600; // Safe fallback in case of API failure
    }
  },

  // 2. Generate a USDT (TRC-20) Deposit Address
  async generateDepositAddress(userId: string): Promise<string> {
    try {
      // Mock string for now
      return `T9z${Math.random().toString(36).substring(7).toUpperCase()}quidax`; 
    } catch (error) {
      logger.error('Failed to generate Quidax address');
      throw new Error('Could not generate crypto address');
    }
  }
};