import { Expo } from 'expo-server-sdk';
import { logger } from '../config/logger';

// Create a new Expo SDK client
const expo = new Expo();

export const sendPushNotification = async (pushToken: string | null | undefined, title: string, body: string, data: any = {}) => {
  // If the user hasn't allowed notifications, their token will be null. Safely exit.
  if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
    return;
  }

  const messages = [{
    to: pushToken,
    sound: 'default' as const,
    title,
    body,
    data, // This is the hidden JSON payload that routes them to the right screen tomorrow!
  }];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
    logger.info({ pushToken, title }, '📲 Push notification sent successfully');
  } catch (error) {
    logger.error({ err: error, pushToken }, 'Failed to send push notification');
  }
};