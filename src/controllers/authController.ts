import { Request, Response, Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../server'; 
import crypto from 'crypto';
import { User, Otp } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'amit_mehta_themadbrains';
const TOKEN_EXPIRY = '8h'; // JWT Token expires in 1 hour

// Generate JWT Token
function generateToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// Generate a random 6-digit OTP
function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Set OTP expiration time (e.g., 10 minutes from now)
function otpExpiryTime(): Date {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);
  return now;
}

// Hash password
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Compare password
async function comparePassword(enteredPassword: string, storedPassword: string): Promise<boolean> {
  return bcrypt.compare(enteredPassword, storedPassword);
}


// ================================================================================================
// -------------------------------------- Register User -------------------------------------------
// ================================================================================================
export async function register(req: Request, res: Response) {
  const { name, email, password, confirmPassword }: { name: string; email: string; password: string; confirmPassword: string } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists. Please log in or use OTP verification.' });
    }

    const hashedPassword = await hashPassword(password);
    const newUser: User = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: 'USER' },
    });

    const otpCode = generateOtp();
    const expiresAt = otpExpiryTime();

    await prisma.otp.create({
      data: { userId: newUser.id, code: otpCode, expiresAt },
    });

    return res.status(201).json({ message: 'User registered successfully. OTP sent.', otp: otpCode }); // Do not include OTP in production
  } catch (error: any) {
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
}



// ================================================================================================
// -------------------------------------- Login User ----------------------------------------------
// ================================================================================================
export async function login(req: Request, res: Response) {
  const { email, password }: { email: string; password: string } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const otpCode = generateOtp();
    const expiresAt = otpExpiryTime();

    await prisma.otp.upsert({
      where: { userId: user.id },
      update: { code: otpCode, expiresAt },
      create: { userId: user.id, code: otpCode, expiresAt },
    });

    return res.status(200).json({ message: 'OTP sent successfully', otp: otpCode }); // In production, do not return OTP
  } catch (error: any) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
}

// ================================================================================================
// -------------------------------------- Logout User ---------------------------------------------
// ================================================================================================
export async function logout(req: Request, res: Response) {
  res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  return res.status(200).json({ message: 'Logout successful' });
}

// ================================================================================================
// -------------------------------------- Forget Password -----------------------------------------
// ================================================================================================
export async function forgetPassword(req: Request, res: Response) {
  const { email }: { email: string } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: 'User with this email does not exist' });
    }

    const otpCode = generateOtp();
    const expiresAt = otpExpiryTime();

    await prisma.otp.upsert({
      where: { userId: user.id },
      update: { code: otpCode, expiresAt },
      create: { userId: user.id, code: otpCode, expiresAt },
    });

    return res.status(200).json({ message: 'OTP sent successfully', otp: otpCode }); // In production, do not return OTP
  } catch (error: any) {
    return res.status(500).json({ message: 'Forget password failed', error: error.message });
  }
}

// ================================================================================================
// -------------------------------------- Reset Password ------------------------------------------
// ================================================================================================
export async function resetPassword(req: Request, res: Response) {
  const { email, otp, newPassword, confirmNewPassword }: { email: string; otp: string; newPassword: string; confirmNewPassword: string } = req.body;

  if (!email || !otp || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: 'User with this email does not exist' });
    }

    const userOtp = await prisma.otp.findUnique({ where: { userId: user.id } });

    if (!userOtp || userOtp.code !== otp || userOtp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await prisma.otp.delete({ where: { userId: user.id } });

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Password reset failed', error: error.message });
  }
}

// ================================================================================================
// -------------------------------------- Verify OTP ----------------------------------------------
// ================================================================================================
export async function verifyOtp(req: Request, res: Response) {
  const { userId, otp }: { userId: string; otp: string } = req.body;

  if (!userId || !otp) {
    return res.status(400).json({ message: 'User ID and OTP are required' });
  }

  try {
    const userOtp = await prisma.otp.findUnique({ where: { userId } });

    if (!userOtp || userOtp.code !== otp || userOtp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await prisma.otp.delete({ where: { userId } });

    return res.status(200).json({ message: 'OTP verified successfully.' });
  } catch (error: any) {
    return res.status(500).json({ message: 'OTP verification failed', error: error.message });
  }
}