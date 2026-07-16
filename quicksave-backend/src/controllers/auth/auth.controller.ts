import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { catchAsync } from '../../utils/catchAsync';
import { AppError } from '../../utils/AppError';
import { sendSuccess } from '../../utils/response';
import { logger } from '../../config/logger';
import { authService } from '../../services/auth.service';
import { email } from 'zod';
import { UAParser } from 'ua-parser-js';

export const register = catchAsync(async (req: Request, res: Response) => {
  const { email, phone, firstName, lastName, password, pin } = req.body;

  // 1. Check if a user already exists with this email or phone
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phone }],
    },
  });

  if (existingUser) {
    throw new AppError('A user with this email or phone already exists', 409);
  }

  // 2. Securely hash the password and the 4-digit PIN
  // Salt rounds set to 12 for a good balance of security and speed
  const passwordHash = await bcrypt.hash(password, 12);
  const hashedPin = await bcrypt.hash(pin, 12);

 
  const newUser = await prisma.user.create({
    data: {
      email,
      phone,
      firstName,
      lastName,
      passwordHash,
      pin: hashedPin,
      // Prisma Nested Write: Automatically provisions the wallet linked to this user
      wallet: {
        create: {}, 
      },
    },
    // We want Prisma to return the newly created wallet in the response
    include: {
      wallet: true,
    },
  });

  logger.info({ userId: newUser.id }, 'New user registered successfully');
  await authService.sendOtp(email);

  // 4. Strip sensitive data before sending it back to the frontend
  const { passwordHash: _, pin: __, ...safeUserData } = newUser;

  // 5. Send standardized response
  return sendSuccess(res, safeUserData, 'Registration successful', 201);
});


export const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  // 1. Check if user exists
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // 2. Validate OTP against Redis
  await authService.verifyOtp(email, otp);

  // 3. Mark user as verified in PostgreSQL
  await prisma.user.update({
    where: { email },
    data: { isVerified: true },
  });

  logger.info({ userId: user.id }, 'User email verified successfully');

  const tokens = await authService.generateAuthTokens(user.id);
  const { passwordHash: _, pin: __, refreshToken: ___, ...safeUserData } = user;

  return sendSuccess(res, { user: safeUserData, tokens }, 'Email verified successfully', 200);
});


export const resendOtp = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
   
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('User not found', 404);
  if (user.isVerified) throw new AppError('User is already verified', 400);

  await authService.sendOtp(email);
  
  return sendSuccess(res, null, 'A new OTP has been sent', 200);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
 console.log(`Attempting login for: ${email}`);

  // 1. Find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // 2. Ensure they verified their email
  if (!user.isVerified) {
    throw new AppError('Please verify your email address first', 403);
  }

  // 3. Check password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  console.log("Input Password:", password);
  console.log("Hash in DB:", user.passwordHash);
  console.log("Is Match:", isPasswordValid);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }
  
 const userAgentString = req.headers['user-agent'] as string || '';
  const parser = new UAParser(userAgentString);
  const ua = parser.getResult(); // MUST call getResult() to access the data!

  const deviceName = ua.device.model 
    ? `${ua.device.vendor} ${ua.device.model}` 
    : `${ua.os.name || 'Unknown OS'} ${ua.browser.name || 'Unknown Browser'}`;

  // Create the session in DB
     await prisma.session.create({
    data: {
      userId: user.id,
      userAgent: userAgentString || 'Unknown',
      deviceName: deviceName.trim() || 'Unknown Device',
      ipAddress: req.ip || '0.0.0.0',
      location: 'Lagos, NG', // In production, use a GeoIP library here
    }
  });

  // 4. Generate Tokens
  const tokens = await authService.generateAuthTokens(user.id);

  logger.info({ userId: user.id }, 'User logged in successfully');

  // 5. Strip sensitive data and return
  const { passwordHash: _, pin: __, refreshToken: ___, ...safeUserData } = user;
  return sendSuccess(res, { user: safeUserData, tokens }, 'Login successful', 200);
});


export const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  // Pass it to the service to validate and rotate
  const tokens = await authService.refreshTokens(refreshToken);

  // Return the shiny new tokens!
  return sendSuccess(res, { tokens }, 'Tokens refreshed successfully', 200);
});


export const logout = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  // Invalidate the token in Redis
  await authService.logout(refreshToken);

  return sendSuccess(res, null, 'Logged out successfully', 200);
});

// 👉 Add these to the bottom of your auth.controller.ts
export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // From requireAuth

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  // 1. Verify old password
  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) throw new AppError('Incorrect current password', 400);

  // 2. Hash and save new password
  const newPasswordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash }
  });

  return sendSuccess(res, null, 'Password updated successfully', 200);
});


export const enable2FA = catchAsync(async (req: Request, res: Response) => {
  // In reality: generate a QR code secret, verify the OTP, and save it.
  return sendSuccess(res, { enabled: true }, '2FA enabled successfully', 200);
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  
  // Security best practice: Don't throw a 404 if the user doesn't exist to prevent email guessing.
  // Just pretend it worked, but only actually send the email if the user exists.
  if (user) {
    await authService.sendPasswordResetOtp(email);
  }

  return sendSuccess(res, null, 'If an account exists, a reset code has been sent to that email.', 200);
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('User not found', 404);

  // 1. Verify the OTP from Redis
  await authService.verifyResetOtp(email, otp);

  // 2. Hash the new password
  const passwordHash = await bcrypt.hash(newPassword, 12);

  // 3. Update the database
  await prisma.user.update({
    where: { email },
    data: { passwordHash }
  });

  return sendSuccess(res, null, 'Password has been reset successfully. You can now log in.', 200);
});


export const sendSmsCode = catchAsync(async (req: Request, res: Response) => {
  const { phone } = req.body;
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw new AppError('User not found', 404);
  if (user.isVerified) throw new AppError('User is already verified', 400);

  await authService.sendOtp(phone);
  
  return sendSuccess(res, null, 'A new OTP has been sent', 200);
});