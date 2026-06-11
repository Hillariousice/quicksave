import Queue from 'bull';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { payoutService } from '../services/payout.services';

export const payoutQueue = new Queue('group-payouts', env.REDIS_URL);

payoutQueue.process(async (job) => {
  const { groupId } = job.data;
  
  try {
    await payoutService.processNextPayout(groupId);
  } catch (error: any) {
    logger.error({ err: error, groupId }, 'Payout Job Failed');
    // In a real production app, you might emit a socket event here to tell the Admin that 
    // the payout failed (usually because someone missed their contribution!).
  }
});