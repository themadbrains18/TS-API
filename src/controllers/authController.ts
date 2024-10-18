import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../server'; // Import the Prisma instance
import crypto from 'crypto';
import { User, Otp, Prisma } from '@prisma/client'; // Prisma types

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
  now.setMinutes(now.getMinutes() + 10); // OTP valid for 10 minutes
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

// -------------------------------------- Register User ------------------------------------------- //
// ================================================================================================ //
export async function register(req: Request, res: Response) {
  const { name, email, password, confirmPassword, otp }: { name: string; email: string; password: string; confirmPassword: string; otp?: string } = req.body;

  // Basic validation
  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    // If user doesn't exist, create a new user
    if (!existingUser) {
      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Create the new user
      const newUser: User = await prisma.user.create({
        data: { name, email, password: hashedPassword, role: 'USER' },
      });

      // Generate OTP
      const otpCode = generateOtp();
      const expiresAt = otpExpiryTime();

      // Create OTP for the new user
      await prisma.otp.create({
        data: {
          userId: newUser.id, // Use the new user's ID
          code: otpCode,
          expiresAt,
        },
      });

      // In production, you would send the OTP via email or SMS here
      return res.status(201).json({ message: 'User registered successfully. OTP sent.', otp: otpCode }); // Do not return OTP in production
    }
    

    // If OTP is provided, verify it for the existing user
    if (otp) {
      const userOtp: Otp | null = await prisma.otp.findUnique({
        where: { userId: existingUser.id }, // Check OTP for the existing user
      });

      if (!userOtp) {
        return res.status(400).json({ message: 'OTP not found. Please request a new OTP.' });
      }

      if (userOtp.expiresAt < new Date()) {
        return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
      }

      if (userOtp.code !== otp) {
        return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
      }

      // OTP is valid; proceed with registration (or other logic)
      await prisma.otp.delete({ where: { userId: userOtp.userId } }); // Optionally delete OTP after successful use
      return res.status(200).json({ message: 'OTP verified successfully.' });
    } else {
      // If no OTP is provided for an existing user, prompt for OTP generation
      return res.status(400).json({ message: 'User already exist.' });
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Registration failed' });
  }
}


// ================================================================================================ //
// -------------------------------------- User Login with OTP ------------------------------------- //
// ================================================================================================ //
export async function login(req: Request, res: Response) {
  const { email, password, otp }: { email: string; password: string; otp?: string } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find the user by email
    const user: User | null = await prisma.user.findUnique({
      where: { email },
    });

    // If user not found or password doesn't match
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // If OTP is provided, verify it
    if (otp) {
      const userOtp: Otp | null = await prisma.otp.findUnique({
        where: { userId: user.id },
      });

      if (!userOtp) {
        return res.status(400).json({ message: 'OTP not found. Please request a new OTP.' });
      }

      if (userOtp.expiresAt < new Date()) {
        return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
      }

      if (userOtp.code !== otp) {
        return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
      }

      // OTP is valid; proceed with login
      await prisma.otp.delete({ where: { userId: user.id } }); // Optionally delete OTP after successful use

      // Generate JWT token
      const token = generateToken(user.id);

      // Set the token as an HTTP-only cookie (expires in 1 hour)
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 3600000, // 1 hour
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      });

      return res.status(200).json({ message: 'Login successful!', token });
    }

    // If no OTP is provided, check if OTP exists
    const existingOtp: Otp | null = await prisma.otp.findUnique({
      where: { userId: user.id },
    });

    if (existingOtp && existingOtp.expiresAt > new Date()) {
      return res.status(400).json({ message: 'OTP already sent. Please check your email.' });
    }

    // If no OTP exists or expired, generate a new OTP
    const otpCode = generateOtp();
    const expiresAt = otpExpiryTime();

    // Upsert OTP (update if exists, otherwise create)
    await prisma.otp.upsert({
      where: { userId: user.id },
      update: { code: otpCode, expiresAt },
      create: { userId: user.id, code: otpCode, expiresAt },
    });

    // In production, you would send the OTP via email or SMS here
    return res.status(200).json({ message: 'OTP sent successfully', otp: otpCode }); // In production, do not return the OTP
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Login failed' });
  }
}

// ================================================================================================ //
// -------------------------------------- Logout User --------------------------------------------- //
// ================================================================================================ //
export async function logout(req: Request, res: Response) {
  // Clear the token cookie
  res.clearCookie('token', { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

  return res.status(200).json({ message: 'Logout successful' });
}

// ================================================================================================ //
// -------------------------------------- Forget Password ----------------------------------------- //
// ================================================================================================ //
export async function forgetPassword(req: Request, res: Response) {
  const { email }: { email: string } = req.body;

  // Basic validation
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Check if user exists
    const user: User | null = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: 'User with this email does not exist' });
    }

    // Generate an OTP
    const otpCode = generateOtp();
    const expiresAt = otpExpiryTime();

    // Upsert OTP (update if exists, otherwise create)
    await prisma.otp.upsert({
      where: { userId: user.id },
      update: { code: otpCode, expiresAt },
      create: { userId: user.id, code: otpCode, expiresAt },
    });

    // In production, send the OTP via email
    return res.status(200).json({ message: 'OTP sent successfully', otp: otpCode }); // Do not return OTP in production
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Forget password failed' });
  }
}

// ================================================================================================ //
// -------------------------------------- Reset Password ------------------------------------------ //
// ================================================================================================ //
export async function resetPassword(req: Request, res: Response) {
  const { email, otp, newPassword, confirmNewPassword }: { email: string; otp: string; newPassword: string; confirmNewPassword: string } = req.body;

  // Basic validation
  if (!email || !otp || !newPassword || !confirmNewPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    // Find the user by email
    const user: User | null = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: 'User with this email does not exist' });
    }

    // Verify the OTP
    const userOtp: Otp | null = await prisma.otp.findUnique({
      where: { userId: user.id },
    });

    if (!userOtp) {
      return res.status(400).json({ message: 'OTP not found. Please request a new OTP.' });
    }

    if (userOtp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new OTP.' });
    }

    if (userOtp.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // OTP is valid; hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Optionally delete OTP after successful use
    await prisma.otp.delete({ where: { userId: user.id } });

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Password reset failed' });
  }
}