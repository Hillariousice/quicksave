import Queue from 'bull';
import { env } from '../config/env';
import { logger } from '../config/logger';
import prisma from '../config/database';
import { sendEmail } from '../utils/email';
import { payoutService } from '../services/payout.service';

export const schedulerQueue = new Queue('ajo-cron-scheduler', env.REDIS_URL, {
  redis: { maxRetriesPerRequest: null }
});

// --- ⚙️ JOB 1: AUTOMATED PAYOUTS ---
schedulerQueue.process('process-payouts', async (job) => {
  logger.info('🕰️ Running scheduled payout check...');
  
  // 1. Find all rotation slots that are due TODAY (or overdue) and haven't been paid
  const now = new Date();
  
  const dueSlots = await prisma.rotationSlot.findMany({
    where: {
      status: 'PENDING',
      expectedPayoutDate: { lte: now }, // Less than or equal to current time
      group: { status: 'ACTIVE' } // Ensure the group is actually running
    },
  });

  if (dueSlots.length === 0) {
    logger.info('No payouts due today.');
    return;
  }

  // 2. Loop through each due slot and process it using yesterday's engine
  for (const slot of dueSlots) {
    try {
      await payoutService.processNextPayout(slot.groupId);
    } catch (error: any) {
      // We don't throw here! If one group fails (e.g., insufficient funds), 
      // we log it and continue processing the other groups.
      logger.error({ groupId: slot.groupId, err: error.message }, 'Scheduled payout failed for group');
    }
  }
});

// --- ⚙️ JOB 2: CONTRIBUTION REMINDERS ---
schedulerQueue.process('send-reminders', async (job) => {
  logger.info('🕰️ Running scheduled contribution reminders...');

  // Find all active groups
  const activeGroups = await prisma.group.findMany({
    where: { status: 'ACTIVE' },
    include: { members: { include: { user: true } } },
  });

  // In a real app, you would check the Contribution table to see who hasn't paid this cycle.
  // For simplicity, we just send a gentle nudge to all members in active groups.
  for (const group of activeGroups) {
    for (const member of group.members) {
      if (member.user.email) {
        const emailHtml = `
          <h2>Hello ${member.user.firstName},</h2>
          <p>This is a quick reminder to make your upcoming ₦${group.contributionAmount} contribution to <strong>${group.name}</strong>.</p>
          <p>Please fund your wallet and submit your contribution to keep the cycle moving smoothly!</p>
        `;
        
        // Don't wait for the email to send, fire and forget to keep the queue fast
        sendEmail(member.user.email, `Reminder: Upcoming Ajo Contribution`, emailHtml).catch(e => console.error(e));
      }
    }
  }
});

export const initScheduler = async () => {
  // 1. 🚨 PREVENT ZOMBIE JOBS: Clear existing scheduled jobs before adding them again
  // This ensures that if you restart your server, it doesn't double-schedule the jobs in Redis.
  const repeatableJobs = await schedulerQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await schedulerQueue.removeRepeatableByKey(job.key);
  }

  // 2. Schedule Payouts to run every day at 8:00 AM Server Time
  // Cron syntax: "minute hour day month day-of-week" -> "0 8 * * *"
  await schedulerQueue.add('process-payouts', {}, { 
    repeat: { cron: '0 8 * * *' } 
  });

  // 3. Schedule Reminders to run every day at 12:00 PM (Noon)
  await schedulerQueue.add('send-reminders', {}, { 
    repeat: { cron: '0 12 * * *' } 
  });

  logger.info('✅ Background Scheduler initialized. Cron jobs loaded into Redis.');
};