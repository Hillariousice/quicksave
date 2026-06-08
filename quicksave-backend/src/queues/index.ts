import Bull from 'bull';

const redisOptions = {
  redis: {
    host: process.env.BULL_REDIS_HOST || 'localhost',
    port: parseInt(process.env.BULL_REDIS_PORT || '6379', 10),
  },
};

export const contributionReminderQueue = new Bull(
  'contribution-reminders',
  redisOptions
);

export const payoutProcessingQueue = new Bull(
  'payout-processing',
  redisOptions
);

export const groupNotificationQueue = new Bull(
  'group-notifications',
  redisOptions
);

console.log('[Bull] Queues');