import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import { catchAsync } from '../../utils/catchAsync';
import { AppError } from '../../utils/AppError';
import { sendSuccess } from '../../utils/response';
import { authService } from '../../services/auth.service';


export const setupSuperAdmin = catchAsync(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phone, secretKey } = req.body;

  // 1. Validate Secret Key from .env
  if (!secretKey || secretKey !== process.env.ADMIN_SETUP_KEY) {
    throw new AppError('Unauthorized setup attempt: Invalid Secret Key', 401);
  }

  // 2. Check if any Super Admin already exists to prevent duplicate setups
  const existingSuper = await prisma.user.findFirst({
    where: { systemRole: 'SUPER_ADMIN' }
  });
  if (existingSuper) {
    throw new AppError('Super Admin already exists. Please use login.', 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      systemRole: 'SUPER_ADMIN',
      isVerified: true,
      wallet: { create: {} }
    }
  });

  return sendSuccess(res, { email: admin.email }, 'Super Admin created successfully', 201);
});

export const adminLogin = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError('Invalid admin credentials', 401);
  }

  // Strictly block mobile/standard users from the Admin Panel
  if (user.systemRole !== 'SUPER_ADMIN' && user.systemRole !== 'ADMIN') {
    throw new AppError('Access denied. Admin privileges required.', 403);
  }

  const tokens = await authService.generateAuthTokens(user.id);

  return sendSuccess(res, {
    user: {
      id: user.id,
      email: user.email,
      role: user.systemRole,
      name: `${user.firstName} ${user.lastName}`
    },
    tokens
  }, 'Admin authenticated successfully');
});


export const createSubAdmin = catchAsync(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phone } = req.body;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new AppError('Email already registered', 400);

  const passwordHash = await bcrypt.hash(password, 10);

  const newAdmin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      systemRole: 'ADMIN',
      isVerified: true,
      wallet: { create: {} }
    }
  });

  return sendSuccess(res, { id: newAdmin.id }, 'New admin added successfully', 201);
});