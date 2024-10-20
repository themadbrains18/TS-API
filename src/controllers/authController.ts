import { Request, Response, Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../server';
import crypto from 'crypto';
import { User, Otp } from '@prisma/client';
import { sendOtpEmail } from '../services/nodeMailer';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const TOKEN_EXPIRY = '8h'; // JWT Token expires in 8 hours

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
      return res.status(400).json({ message: 'User already exists. Please log in.' });
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

    // Send the OTP to the user's email
    await sendOtpEmail(email, otpCode);

    return res.status(201).json({
      message: 'User registered successfully. OTP sent to email.',
    });
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

    // Generate JWT Token
    const token = generateToken(user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { token },
    });

    return res.status(200).json({ message: 'Login successful. OTP sent.', token });
  } catch (error: any) {
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
}

// ================================================================================================
// -------------------------------------- Logout User ---------------------------------------------
// ================================================================================================
export async function logout(req: Request, res: Response) {
  try {
    const { userId } = req.body;

    await prisma.user.update({
      where: { id: userId },
      data: { token: null },
    });

    return res.status(200).json({ message: 'Logout successful' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Logout failed', error: error.message });
  }
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
      return res.status(404).json({ message: 'User not found with this email' });
    }

    // Generate OTP and set expiry
    const otpCode = generateOtp();
    const expiresAt = otpExpiryTime();

    // Upsert OTP for user
    await prisma.otp.upsert({
      where: { userId: user.id },
      update: { code: otpCode, expiresAt },
      create: { userId: user.id, code: otpCode, expiresAt },
    });

    // Send the OTP to the user's email
    await sendOtpEmail(email, otpCode);

    return res.status(200).json({ message: 'OTP sent to email for password reset.' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error sending password reset OTP', error: error.message });
  }
}


// ================================================================================================
// -------------------------------------- Reset Password with OTP ---------------------------------
// ================================================================================================
export async function resetPasswordWithOtp(req: Request, res: Response) {
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
      return res.status(404).json({ message: 'User not found' });
    }

    // Find OTP
    const userOtp = await prisma.otp.findUnique({ where: { userId: user.id } });

    // Validate OTP
    if (!userOtp || userOtp.code !== otp || userOtp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete the OTP after successful password reset
    await prisma.otp.delete({ where: { userId: user.id } });

    return res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error resetting password', error: error.message });
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

// ================================================================================================
// -------------------------------------- Resend OTP ---------------------------------------------
// ================================================================================================
export async function resendOtp(req: Request, res: Response) {
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

    return res.status(200).json({ message: 'OTP resent successfully.', results: { otp: true } });
  } catch (error: any) {
    return res.status(500).json({ message: 'Resend OTP failed', error: error.message });
  }
}
