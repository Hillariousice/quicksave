import prisma from "../config/database";
import { logger } from "../config/logger";
import { groupService } from "./group.service";
import { getIo } from "../config/socket";
import { sendPushNotification } from "../utils/pushNotification";

export const payoutService = {
  async processNextPayout(groupId: string) {
    logger.info({ groupId }, 'Starting payout processing...');

    // 1. Fetch Group, its Wallet, and Members count
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { wallet: true, members: true },
    });

    if (!group || !group.wallet) throw new Error('Group or Group Vault not found');

    // 2. Determine the expected payout amount
    const expectedPayout = group.contributionAmount * group.members.length;

    // 3. Verify the group actually has enough money in the vault
    if (group.wallet.balance < expectedPayout) {
      throw new Error(`Insufficient funds in group vault. Expected ₦${expectedPayout}, found ₦${group.wallet.balance}`);
    }

    // 4. Find the NEXT person in line to get paid
    // 👉 Added "as any" to bypass the stale TypeScript cache!
    const nextSlot = await prisma.rotationSlot.findFirst({
      where: { groupId, status: 'PENDING' },
      orderBy: { position: 'asc' },
      include: { user: { include: { wallet: true } } },
    }) as any; 

    if (!nextSlot) throw new Error('No pending rotation slots found for this group');
    if (!nextSlot.user.wallet) throw new Error('Recipient does not have a valid wallet');

    const recipientUserId = nextSlot.userId;
    const recipientWalletId = nextSlot.user.wallet.id;

    // 5. Massive Atomic Transfer
    const reference = `PAYOUT_${Date.now()}_${groupId.substring(0, 5)}`;

    await prisma.$transaction(async (tx: any) => {
      // A. Deduct from Group Vault
      await tx.wallet.update({
        where: { id: group.wallet!.id },
        data: { balance: { decrement: expectedPayout } },
      });

      // B. Record Group Debit Ledger
      await tx.transaction.create({
        data: {
          walletId: group.wallet!.id,
          amount: expectedPayout,
          type: 'PAYOUT',
          status: 'SUCCESS',
          reference: `${reference}_GROUP_DEBIT`,
          description: `Payout to ${nextSlot.user.firstName} for cycle #${nextSlot.position}`,
        },
      });

      // C. Credit User's Personal Wallet
      await tx.wallet.update({
        where: { id: recipientWalletId },
        data: { balance: { increment: expectedPayout } },
      });

      // D. Record User Credit Ledger
      await tx.transaction.create({
        data: {
          walletId: recipientWalletId,
          amount: expectedPayout,
          type: 'PAYOUT',
          status: 'SUCCESS',
          reference: `${reference}_USER_CREDIT`,
          description: `Received Ajo payout for group: ${group.name}`,
        },
      });

      // E. Mark the Rotation Slot as PAID
      await tx.rotationSlot.update({
        where: { id: nextSlot.id },
        data: { status: 'PAID' },
      });
    });

    // 6. Broadcast the exciting news to the whole group in real-time!
    const message = `🎉 ${nextSlot.user.firstName} just received the payout of ₦${expectedPayout}!`;
    await groupService.logAndBroadcast(groupId, 'PAYOUT_SENT', message);

    const io = getIo();
    io.to(`user_${recipientUserId}`).emit('walletUpdated'); // Triggers balance refresh
    io.to(`user_${recipientUserId}`).emit('payoutReceived', {
      amount: expectedPayout,
      groupName: group.name
    });

    await sendPushNotification(
      nextSlot.user.pushToken,
      'Payout Received! 🎉',
      `₦${expectedPayout} from ${group.name} was just credited to your wallet.`,

      // 👉 CRITICAL: This exact payload is what `handleNotificationTap` reads!
      { type: 'PAYOUT', groupId, amount: expectedPayout, reference: `PAYOUT_${Date.now()}` }
    );
    logger.info({ groupId, recipientUserId, amount: expectedPayout }, 'Payout processed successfully');
    return { success: true, recipient: nextSlot.user.firstName, amount: expectedPayout };
  }
};