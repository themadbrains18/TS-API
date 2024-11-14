"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userLoginSchema = exports.userSignUpSchema = void 0;
const zod_1 = require("zod");
/**
 * User Signup with OTP Validation DTO (Data Transfer Object) Schema.
 *
 * This schema is used to validate user signup data, ensuring that the email, name, password, and optional OTP fields are properly formatted and valid before proceeding with the signup process. It also ensures that the passwords match.
 *
 * The schema includes the following fields:
 *
 * - `email`: A required string that must be a valid email address. It has a maximum length of 40 characters and a minimum length of 8 characters.
 * - `name`: A required string representing the user's name. It must contain at least 1 character.
 * - `password`: A required string for the user's password. It must:
 *   - Be at least 8 characters long and a maximum of 32 characters.
 *   - Include at least one lowercase letter, one uppercase letter, one number, and one special character (e.g., `!@#$%&*-`).
 * - `confirmPassword`: A required string that must match the `password`. If the passwords do not match, an error is returned.
 * - `otp`: An optional string field for the one-time password (OTP), which can be provided during signup.
 *
 * The schema uses `zod`'s validation methods:
 * - `email()` ensures a valid email format.
 * - `min()` and `max()` are used to enforce length constraints.
 * - `regex()` ensures the password contains the required character types.
 * - `.refine()` ensures that `password` and `confirmPassword` match.
 *
 * This schema validates the user signup data before the system processes the request to create a new user account.
 */
exports.userSignUpSchema = zod_1.z
    .object({
    email: zod_1.z.string().email({ message: 'Invalid email address' }).max(40).min(8),
    name: zod_1.z.string().min(1, { message: 'Name is required' }),
    password: zod_1.z
        .string()
        .min(8, 'The password must be at least 8 characters long')
        .max(32, 'The password must be a maximum of 32 characters long')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&*-])[A-Za-z\d!@#$%&*-]{8,}$/, 'Password must include one lowercase letter, one uppercase letter, one number, and one special character'),
    confirmPassword: zod_1.z.string(),
    otp: zod_1.z.string().optional(), // OTP optional for signup
})
    .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: "Passwords don't match",
});
/**
 * User Login with OTP Validation DTO (Data Transfer Object) Schema.
 *
 * This schema is used to validate user login data, ensuring that the email and password are correctly formatted, and optionally validating the OTP if provided. It ensures the required fields are present and in the proper format before proceeding with the login process.
 *
 * The schema includes the following fields:
 *
 * - `email`: A required string that must be a valid email address. It has a maximum length of 40 characters and a minimum length of 8 characters.
 * - `password`: A required string for the user's password. It must be at least 8 characters long.
 * - `otp`: An optional string field for the one-time password (OTP), which may be provided during login. If not provided, the login can still proceed.
 *
 * The schema uses `zod`'s validation methods:
 * - `email()` ensures a valid email format.
 * - `min()` enforces the minimum length of the email and password fields.
 *
 * This schema validates the user login data before the system processes the request to authenticate the user.
 */
exports.userLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email({ message: 'Invalid email address' }).max(40).min(8),
    password: zod_1.z.string().min(8, { message: 'The password must be at least 8 characters long' }),
    otp: zod_1.z.string().optional(),
});
