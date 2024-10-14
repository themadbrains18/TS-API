// src/dto/user.dto.ts

import { z } from 'zod';

// ================================================================================================ //
// ----------------- Schema for user signup validation with OTP -------------------- //
// ================================================================================================ //
export const userSignUpSchema = z
  .object({
    email: z.string().email({ message: 'Invalid email address' }).max(40).min(8),
    name: z.string().min(1, { message: 'Name is required' }),
    password: z
      .string()
      .min(8, 'The password must be at least 8 characters long')
      .max(32, 'The password must be a maximum of 32 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*-])[A-Za-z\d!@#$%&*-]{8,}$/,
        'Password must include one lowercase letter, one uppercase letter, one number, and one special character',
      ),
    confirmPassword: z.string(),
    otp: z.string().optional(), // OTP optional for signup
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: "Passwords don't match",
  });


// ================================================================================================ //
// -----------------  Schema for user login validation with OTP -------------------- //
// ================================================================================================ //
export const userLoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }).max(40).min(8),
  password: z.string().min(8, { message: 'The password must be at least 8 characters long' }),
  otp: z.string().optional(), // OTP is optional during login
});
