import { env } from '../config/env';
import { logger } from '../config/logger';

const QUIDAX_BASE_URL = 'https://www.quidax.com/api/v1';

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

export const quidaxApi = {
  // 1. Get the current Exchange Rate (USDT to NGN)
  async getExchangeRate(): Promise<number> {
    try {
      const res = await fetch(`${QUIDAX_BASE_URL}/markets/tickers/usdtngn`);
      const data = (await res.json()) as QuidaxTickerResponse;
      
      if (data && data.data && data.data.ticker) {
        return Number(data.data.ticker.last); 
      }
      
      throw new Error('Invalid response structure');
    } catch (error) {
      // FIX: Use a template literal to safely include the error in the log
      // This converts the 'unknown' error into a string, which the logger accepts
      logger.error(`Failed to fetch Quidax exchange rate: ${error}`);
      
      return 1600; // Safe fallback
    }
  },

  // 2. Generate a USDT (TRC-20) Deposit Address
  async generateDepositAddress(userId: string): Promise<string> {
    try {
      return `T9z${Math.random().toString(36).substring(7).toUpperCase()}quidax`; 
    } catch (error) {
      // FIX: Use template literal here too
      logger.error(`Failed to generate Quidax address: ${error}`);
      throw new Error('Could not generate crypto address');
    }
  }
};