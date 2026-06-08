import redis from '../config/redis';
import { sendEmail } from '../utils/email';
import { AppError } from '../utils/AppError';
import { env } from '../config/env';
import jwt from 'jsonwebtoken';

export const authService = {
  // 1. Generate and Send OTP via Email
  async sendOtp(email: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to Redis using the email as the key
    const redisKey = `otp:${email}`;
    await redis.setex(redisKey, 600, otp); // Expires in 10 mins

    // Send the Email
    const subject = 'Verify your Quicksave Account';
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Welcome to Quicksave! 🎉</h2>
        <p>Your email verification code is:</p>
        <h1 style="color: #914ae2ff; letter-spacing: 5px;">${otp}</h1>
        <p>This code expires in 10 minutes. Please do not share it with anyone.</p>
      </div>
    `;
    
    await sendEmail(email, subject, html);
    
    return otp;
  },

  // 2. Verify OTP
  async verifyOtp(email: string, otp: string) {
    const redisKey = `otp:${email}`;
    const storedOtp = await redis.get(redisKey);

    if (!storedOtp) {
      throw new AppError('OTP expired or not found. Please request a new one.', 400);
    }

    if (storedOtp !== otp) {
      throw new AppError('Invalid OTP code', 400);
    }

    await redis.del(redisKey);
    return true;
  },

   async generateAuthTokens(userId: string) {
    // 1. Create Access Token (Short-lived, used for API requests)
    const accessToken = jwt.sign({ id: userId }, env.JWT_SECRET, {
         expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    // 2. Create Refresh Token (Long-lived, used to get new Access Tokens)
    const refreshToken = jwt.sign({ id: userId }, env.REFRESH_TOKEN_SECRET, {
           expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    // 3. Store Refresh Token in Redis (Expires in 30 days = 2,592,000 seconds)
    // This allows us to instantly invalidate tokens if a user logs out!
    const redisKey = `refresh_token:${userId}`;
    await redis.setex(redisKey, 2592000, refreshToken);

    return { accessToken, refreshToken };
  },

  async refreshTokens(oldRefreshToken: string) {
    try {
      // 1. Verify the old refresh token signature
      const decoded = jwt.verify(oldRefreshToken, env.REFRESH_TOKEN_SECRET) as { id: string };
      const userId = decoded.id;

      // 2. Check if this token is the currently active one in Redis
      const redisKey = `refresh_token:${userId}`;
      const activeToken = await redis.get(redisKey);

      if (!activeToken) {
        throw new AppError('Refresh token expired or logged out. Please log in again.', 401);
      }

      if (activeToken !== oldRefreshToken) {
        // 🚨 SECURITY BREACH DETECTED 🚨
        // Someone tried to use an old refresh token. We must revoke all access immediately!
        await redis.del(redisKey);
        throw new AppError('Security alert: Invalid refresh token detected. You have been logged out.', 403);
      }

      // 3. Generate a brand new pair (This automatically overwrites the old token in Redis!)
      return await this.generateAuthTokens(userId);

    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Your session has expired. Please log in again.', 401);
      }
      if (error instanceof AppError) throw error; // Re-throw our custom errors
      throw new AppError('Invalid refresh token.', 401);
    }
  },

  // 👉 NEW: Logout Logic
  async logout(refreshToken: string) {
    try {
      // We use ignoreExpiration: true so that even if the token just expired, 
      // we can still decode it to find the user ID and clean up Redis.
      const decoded = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET, { ignoreExpiration: true }) as { id: string };
      
      // Delete the token from Redis, instantly revoking their ability to get new access tokens
      await redis.del(`refresh_token:${decoded.id}`);
      return true;
    } catch (error) {
      // If the token is completely mangled, just ignore it. The user is essentially logged out anyway.
      return true; 
    }
  }
};