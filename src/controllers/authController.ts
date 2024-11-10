import { Request, Response, } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../server';
import { User } from '@prisma/client';
import crypto from 'crypto';
import { sendOtpEmail } from '../services/nodeMailer';
import { deleteFileFromFirebase, uploadFileToFirebase } from '../services/fileService';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const TOKEN_EXPIRY = '24h'; // JWT Token expires in 8 hours

/**
 * Generates a JWT token for the given user ID.
 * 
 * @param {string} userId - The ID of the user for whom the token is generated.
 * @returns {string} - The generated JWT token.
 */
function generateToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}


/**
 * Generates a random 6-digit OTP (One-Time Password).
 * 
 * @returns {string} - A 6-digit OTP as a string.
 * Note: Currently, this function returns a static value ('123456').
 * To use a truly random OTP, uncomment the `crypto.randomInt` line.
 */
function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
  return '123456';
}


/**
 * Sets the OTP expiration time.
 * 
 * @returns {Date} - A Date object representing the expiration time (e.g., 1 minute from now).
 * Note: Adjust the time by modifying the `setMinutes` parameter.
 */
function otpExpiryTime(): Date {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 3);
  return now;
}

/**
 * Hashes a given password using bcrypt.
 * 
 * @param {string} password - The plaintext password to be hashed.
 * @returns {Promise<string>} - A promise that resolves to the hashed password.
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compares an entered password with a stored hashed password.
 * 
 * @param {string} enteredPassword - The plaintext password to check.
 * @param {string} storedPassword - The hashed password stored in the database.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the passwords match, otherwise `false`.
 */
async function comparePassword(enteredPassword: string, storedPassword: string): Promise<boolean> {
  return bcrypt.compare(enteredPassword, storedPassword);
}


/**
 * Handles user registration.
 * 
 * @param {Request} req - The request object, expected to contain `name`, `email`, `password`, `confirmPassword`, and optionally `otp` in the body.
 * @param {Response} res - The response object used to send responses back to the client.
 * @returns {Promise<Response>} - Sends a response with status and message about registration.
 * 
 */
export async function register(req: Request, res: Response) {
  const { name, email, password, confirmPassword, otp } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    if (!otp) {
      const otpCode = generateOtp();
      const expiresAt = otpExpiryTime();

      await prisma.otp.upsert({
        where: { email: email },
        update: { code: otpCode, expiresAt },
        create: { email: email, code: otpCode, expiresAt },
      });

      await sendOtpEmail(email, otpCode);
    }
    if (otp) {
      const verificationResponse = await verifyOtp(req);

      console.log(verificationResponse, "==response");

      if (verificationResponse.status === 200) {
        const hashedPassword = await hashPassword(password);
        const newUser: User = await prisma.user.create({
          data: { name, email, password: hashedPassword, role: 'USER' },
        });

        return res.status(201).json({ results: { message: 'User registered successfully.', user: newUser } });
      } else {
        return res.status(verificationResponse.status).json(verificationResponse);
      }
    }

    return res.status(201).json({
      results: { message: 'User registered successfully. OTP sent to email.', otp: true }
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
}


/**
 * Handles user login.
 * 
 * @param {Request} req - The request object, expected to contain `email`, `password`, and optionally `otp` in the body.
 * @param {Response} res - The response object used to send responses back to the client.
 * @returns {Promise<Response>} - Sends a response with status and message about the login attempt.
 * 
 */
export async function login(req: Request, res: Response) {
  const { email, password, otp } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Check if the user exists and if the password is correct
    if (!user || !(await comparePassword(password, user.password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    if (!otp) {

      // Generate a new OTP and its expiration time
      const otpCode = generateOtp();
      const expiresAt = otpExpiryTime();

      // Upsert the OTP record (create or update if it already exists)
      await prisma.otp.upsert({
        where: { email: email },
        update: { code: otpCode, expiresAt },
        create: { email: email, code: otpCode, expiresAt },
      });

      // Send the OTP to the user's email
      await sendOtpEmail(email, otpCode);
      return res.status(200).json({ results: { message: 'OTP sent to email for login', otp: true } });
    }
    else {
      const verificationResponse = await verifyOtp(req);

      // Check if OTP verification was successful
      if (verificationResponse.status === 200) {
        // Generate JWT Token for the session
        const token = generateToken(user.id);

        // Send response with token (to be used in subsequent requests) and OTP verification requirement message
        return res.status(200).json({
          results: {
            message: 'Login successfull.',
            token,
            data: { id: user.id, email: user.email, role: user.role, name: user.name, image: user.profileImg, freeDownloads: user.freeDownloads, number: user.number }
          }
        });
      } else {
        console.log("herer", verificationResponse.status);

        return res.status(verificationResponse.status).json({ message: verificationResponse.message });
      }


    }

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
}


/**
 * Handles user logout.
 * 
 * @param {Request} req - The request object, expected to contain `userId` in the body.
 * @param {Response} res - The response object used to send responses back to the client.
 * @returns {Promise<Response>} - Sends a response with status and message about the logout attempt.
 * 
 * - Updates the user's record in the database to set their `token` to `null`, effectively logging them out.
 * - Responds with a success message upon successful logout.
 * - Handles any errors and sends an appropriate response to the client.
 */
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


/**
 * Handles the "Forget Password" process by generating and sending an OTP to the user's email.
 * 
 * @param {Request} req - The request object, expected to contain `email` in the body.
 * @param {Response} res - The response object used to send responses back to the client.
 * @returns {Promise<Response>} - Sends a response with status and message about the OTP sending process.
 * 
 */
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

    const otpCode = generateOtp();
    const expiresAt = otpExpiryTime();

    await prisma.otp.upsert({
      where: { email: email },
      update: { code: otpCode, expiresAt },
      create: { email: email, code: otpCode, expiresAt },
    });

    await sendOtpEmail(email, otpCode);

    return res.status(200).json({ message: 'OTP sent to email for password reset.', results: { otp: true } });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error sending password reset OTP', error: error.message });
  }
}


/**
 * Handles password reset with OTP verification.
 * 
 * @param {Request} req - The request object, containing `email`, `otp`, `newPassword`, and `confirmPassword`.
 * @param {Response} res - The response object used to send status and message back to the client.
 * @returns {Promise<Response>} - Sends a response indicating the result of the password reset process.
 * 
 * - Checks if `email` and `otp` are provided and verifies user existence.
 * - If `newPassword` is provided, validates, hashes, and updates the password; otherwise, verifies the OTP.
 */
export async function resetPasswordWithOtp(req: Request, res: Response) {
  const { email, otp, newPassword, confirmPassword }: { email: string; otp: string; newPassword: string; confirmPassword: string } = req.body;

  // console.log(email, otp, newPassword, confirmPassword , "email, otp, newPassword, confirmPassword")


  if (!email || !otp) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate JWT Token for the session
    if (newPassword) {
      console.log("here in this");

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
      }
      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user's password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });


      return res.status(200).json({ message: 'Password reset successfully.', });
    }
    else {
      const userOtp = await prisma.otp.findUnique({ where: { email: email } });

      const verificationResponse = await verifyOtp(req);
      console.log(verificationResponse,
        " verification response", newPassword
      );

      // Check if OTP verification was successful
      if (verificationResponse.status === 200) {
        return res.status(verificationResponse.status).json({ results: { message: verificationResponse.message, otp: true } });

      } else {
        return res.status(verificationResponse.status).json(verificationResponse.message);
      }
    }

  } catch (error: any) {
    return res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
}

/**
 * Verifies the OTP for a given email.
 * 
 * @param {Request} req - The request object, containing `email` and `otp`.
 * @returns {Promise<{ status: number; message: string }>} - Returns the status and message of OTP verification.
 * 
 * - Checks that both `email` and `otp` are provided.
 * - Retrieves the OTP record from the database.
 * - Verifies that the OTP is valid and not expired.
 * - Deletes the OTP record after successful verification.
 * - Handles errors and returns appropriate status and message.
 */
export async function verifyOtp(req: Request): Promise<{ status: number; message: string }> {
  const { email, otp }: { email: string; otp: string } = req.body;

  // Validate the presence of email and OTP
  if (!email || !otp) {
    return { status: 400, message: 'Email and OTP are required' };
  }

  try {
    // Find the OTP record for the provided email
    const userOtp = await prisma.otp.findUnique({ where: { email } });

    // Check if OTP is valid and not expired
    if (!userOtp || userOtp.code !== otp || userOtp.expiresAt < new Date()) {
      return { status: 400, message: 'Invalid or expired OTP' };
    }

    // Delete the OTP after successful verification
    await prisma.otp.delete({ where: { email } });

    return { status: 200, message: 'OTP verified successfully.' };
  } catch (error: any) {
    console.error(error);
    return { status: 500, message: error.message };
  }
}


/**
 * Resends the OTP to the user's email.
 * 
 * @param {Request} req - The request object, expected to contain `email` in the body.
 * @param {Response} res - The response object used to send responses back to the client.
 * @returns {Promise<Response>} - Sends a response indicating the status of the OTP resend process.
 * 
 * - Validates that `email` is provided.
 * - Checks if a user with the provided email exists.
 * - Generates a new OTP and sets its expiration time.
 * - Updates or creates the OTP record in the database.
 * - Sends the OTP to the user's email.
 * - Handles errors and returns an appropriate response if an error occurs.
 */
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
      where: { email: email },
      update: { code: otpCode, expiresAt },
      create: { email: email, code: otpCode, expiresAt },
    });
    await sendOtpEmail(email, otpCode);

    return res.status(200).json({ message: 'OTP resent successfully.', results: { otp: true } });
  } catch (error: any) {
    return res.status(500).json({ message: 'Resend OTP failed', error: error.message });
  }
}



/**
 * Checks if the user is authenticated and retrieves user information from the database.
 * 
 * @param {Request} req - The request object, expected to contain the authenticated user's information.
 * @param {Response} res - The response object used to send responses back to the client.
 * @returns {Promise<Response>} - Sends a response containing the user data if authenticated, or an error message if unauthorized.
 * 
 * - Verifies that the `user` object is present in the request, indicating authentication.
 * - If the user is authenticated, retrieves the user's information from the database.
 * - Sends a success response with the user data if the user exists.
 * - Handles errors and sends an appropriate response if the user is not authenticated or if there are any issues with the database query.
 */
export async function checkUser(req: Request, res: Response) {
  try {
    // Confirm if user information is populated in the request object
    if (!req.user || !req.user.id) {
      console.error("User not authenticated or user ID missing");
      return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    }
    console.log("hreerer");

    let user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    return res.status(200).json({ user });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}


/**
 * Updates user details such as name, number, and email with OTP verification for email change.
 * 
 * @param {Request} req - The request object, expected to contain user data and OTP details in the body.
 * @param {Response} res - The response object used to send responses back to the client.
 * @returns {Promise<Response>} - Sends a response with a success message or error based on the OTP verification and user update process.
 * 
 * - Verifies the presence of `user.id` in the request to ensure the user is authenticated.
 * - Handles updates to the user's `name` and `number` if provided.
 * - If `currentEmail` is provided without `otp`, it sends an OTP to the current email for verification.
 * - If `currentEmail` and `otp` are provided, it verifies the OTP for the current email.
 * - If `newEmail` is provided without OTP, it sends an OTP to the new email for verification.
 * - If `newEmail` and `otp` are provided, it verifies the OTP for the new email and updates the email address.
 * - Applies the changes to the user in the database and returns the updated user data along with a success message.
 * - Handles errors and sends appropriate responses if any step in the process fails.
 */
export async function updateUserDetails(req: Request, res: Response) {
  const { name, number, currentEmail, newEmail, otp } = req.body;

  if (!req.user?.id) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    // Fetch the current user data
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle name and number update if provided
    const updatedData: Partial<User> = {};
    if (name) updatedData.name = name;
    if (number) updatedData.number = number;

    // Handle OTP verification and email update flow
    if (currentEmail && !otp) {
      // Step 1: Verify if email exists and send OTP if valid
      const userExists = await prisma.user.findUnique({ where: { email: currentEmail } });
      if (!userExists) {
        return res.status(404).json({ message: "Current email not found" });
      }

      // Generate and send OTP to current email
      const otpCode = generateOtp();
      const expiresAt = otpExpiryTime();
      await prisma.otp.upsert({
        where: { email: currentEmail },
        update: { code: otpCode, expiresAt },
        create: { email: currentEmail, code: otpCode, expiresAt },
      });

      await sendOtpEmail(currentEmail, otpCode);
      return res.status(200).json({ message: "OTP sent to current email for verification", sendotp: true });
    }

    if (currentEmail && otp && !newEmail) {
      // Step 2: Verify OTP for current email
      const currentOtp = await prisma.otp.findUnique({ where: { email: currentEmail } });
      if (!currentOtp || currentOtp.code !== otp || currentOtp.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired OTP on current email" });
      }

      // OTP verified on current email; proceed to update email if newEmail is provided
      return res.status(200).json({ message: "OTP verified, you can now proceed with updating the email", otp: true });
    }
    // OTP verified on current email; respond to the user that they can proceed to update the new email
    if (newEmail && !otp) {
      // Send OTP to new email if provided without OTP

      const userExists = await prisma.user.findUnique({ where: { email: newEmail } });
      if (userExists) {
        return res.status(404).json({ message: "This email already exist" });
      }
      const newOtpCode = generateOtp();
      const newExpiresAt = otpExpiryTime();
      await prisma.otp.upsert({
        where: { email: newEmail },
        update: { code: newOtpCode, expiresAt: newExpiresAt },
        create: { email: newEmail, code: newOtpCode, expiresAt: newExpiresAt },
      });

      await sendOtpEmail(newEmail, newOtpCode);
      return res.status(200).json({ message: "OTP sent to new email for verification", sendotp: true });
    }
    if (newEmail && otp) {
      // Step 3: Verify OTP for new email and update if valid
      const newOtpRecord = await prisma.otp.findUnique({ where: { email: newEmail } });
      if (!newOtpRecord || newOtpRecord.code !== otp || newOtpRecord.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired OTP on new email" });
      }

      // OTP verified for new email; update the user email
      updatedData.email = newEmail;
    }

    // Apply the updates
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updatedData,
    });

    return res.status(200).json({ message: "User details updated successfully", user: updatedUser, redirect: newEmail ? true : false });
  } catch (error: any) {
    console.error("Error updating user details:", error);
    return res.status(500).json({ message: "Failed to update user details", error: error.message });
  }
}



/**
 * Fetches a paginated list of user downloads with optional filters for date range and category.
 * 
 * @param {Request} req - The request object with `user.id`, `page`, `sort`, and `category` query parameters.
 * @param {Response} res - The response object for sending data or error messages.
 * @returns {Promise<Response>} - A response containing the download data, pagination info, or error message.
 * 
 * - Verifies user authentication.
 * - Supports filters for date range (`sort`) and download category (`category`).
 * - Returns paginated download data with template details (title, price, images).
 * - Handles errors and sends appropriate responses.
 */
export async function getUserDownloads(req: Request, res: Response) {
  try {
    if (!req.user || !req.user.id) {
      console.error("User not authenticated or user ID missing");
      return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    }

    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 6;
    const offset = (page - 1) * limit;
    const selectedSort = req.query.sort as string || 'All Downloads';
    const selectedCategory = req.query.category as string || 'All';

    // Determine the date range filter based on selectedSort
    let dateFilter = {};
    if (selectedSort !== 'All Downloads') {
      const today = new Date();
      if (selectedSort === 'Last Day') {
        dateFilter = { downloadedAt: { gte: new Date(today.setDate(today.getDate() - 1)) } };
      } else if (selectedSort === 'Last 7 Day') {
        dateFilter = { downloadedAt: { gte: new Date(today.setDate(today.getDate() - 7)) } };
      } else if (selectedSort === 'Last 30 Day') {
        dateFilter = { downloadedAt: { gte: new Date(today.setDate(today.getDate() - 30)) } };
      } else if (selectedSort === 'Last Quarter') {
        dateFilter = { downloadedAt: { gte: new Date(today.setMonth(today.getMonth() - 3)) } };
      } else if (selectedSort === 'Last Year') {
        dateFilter = { downloadedAt: { gte: new Date(today.setFullYear(today.getFullYear() - 1)) } };
      }
    }

    // Determine the category filter based on selectedCategory
    let categoryFilter = {};
    if (selectedCategory === 'Free Download') {
      categoryFilter = { template: { price: 0 } };
    } else if (selectedCategory === 'Premium') {
      categoryFilter = { template: { price: { gt: 0 } } };
    }

    // Combine filters for the query
    const filters = { userId, ...dateFilter, ...categoryFilter };

    const totalCount = await prisma.downloadHistory.count({ where: filters });
    const userDownloads = await prisma.downloadHistory.findMany({
      where: filters,
      include: {
        template: {
          select: {
            title: true,
            price: true,
            sliderImages: true,
            sourceFiles: true,
          },
        },
      },
      skip: offset,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      downloads: userDownloads,
      pagination: {
        page,
        limit,
        totalPages,
        totalCount,
      },
    });
  } catch (error: any) {
    console.error("Error fetching user downloads:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}



/**
 * Fetches the count of free downloads and user's profile image.
 * 
 * @param {Request} req - The request object containing `user.id`.
 * @param {Response} res - The response object to send back the download count and profile image.
 * @returns {Promise<Response>} - A response containing the user's free download count and profile image or an error message.
 * 
 * - Verifies user authentication.
 * - Fetches the count of free downloads and profile image for the authenticated user.
 * - Sends the download count and profile image in the response.
 */
export async function getFreeDownload(req: Request, res: Response) {
  try {
    if (!req.user || !req.user.id) {
      console.error("User not authenticated or user ID missing");
      return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    }

    const userId = req.user.id;
    const count = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        freeDownloads: true,
        profileImg: true
      }
    })

    return res.status(200).json({
      downloads: count
    });
  } catch (error: any) {
    console.error("Error fetching user downloads:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}




/**
 * Updates the profile image for the authenticated user.
 * 
 * @param {Request} req - The request object containing user ID and image file.
 * @param {Response} res - The response object that sends the updated user profile image.
 * @returns {Promise<Response>} - A response with the updated profile image or an error message.
 * 
 * - Verifies that the user is authenticated and the image file is provided.
 * - Uploads the profile image to Firebase and gets the URL.
 * - Updates the user's profile image URL in the database.
 * - Sends a response with a success message and the updated user data.
 */
export async function updateUserImage(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    // Check for user ID and file presence
    if (!userId || !req.file) {
      return res.status(400).json({ message: 'User ID and image file are required.' });
    }

    // Upload new profile image to Firebase
    const profileImageUrl = await uploadFileToFirebase(req.file, 'profileImg');

    console.log(profileImageUrl, "=profileImageUrl");

    // Update the user's profile image in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profileImg: profileImageUrl }, // Store URL in the user's profile image field
    });

    return res.status(200).json({
      message: 'Profile image updated successfully',
      user: { id: updatedUser.id, profileImageUrl: updatedUser.profileImg },
    });
  } catch (error: any) {
    console.error('Error updating profile image:', error);
    return res.status(500).json({ message: 'Failed to update profile image', error: error.message });
  }
}


/**
 * Removes the profile image for the authenticated user.
 * 
 * @param {Request} req - The request object containing user ID.
 * @param {Response} res - The response object that sends the status of profile image removal.
 * @returns {Promise<Response>} - A response with the success message or an error message.
 * - Verifies that the user is authenticated.
 * - Fetches the user's current profile image from the database.
 * - Deletes the profile image from Firebase.
 * - Updates the user's profile image field to null in the database.
 * - Sends a response confirming the removal of the profile image.
 */
export async function removeUserImage(req: Request, res: Response) {
  try {
    const userId = req.user?.id;

    // Check for user ID and file presence
    if (!userId) {
      return res.status(400).json({ message: 'User ID and image file are required.' });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId
      }
    })
    // Upload new profile image to Firebase
    const profileImageUrl = await deleteFileFromFirebase(user?.profileImg || "");


    // Update the user's profile image in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profileImg: null }, // Store URL in the user's profile image field
    });

    return res.status(200).json({
      message: 'Profile image removed successfully',
      user: { id: updatedUser.id, profileImageUrl: updatedUser.profileImg },
    });
  } catch (error: any) {
    console.error('Error updating profile image:', error);
    return res.status(500).json({ message: 'Failed to update profile image', error: error.message });
  }
}



/**
 * Resets the free download count for all users to 3.
 * @returns {Promise<void>} - A promise that resolves when the free download count is successfully reset.
 * - Updates the `freeDownloads` field for all users in the database to 3.
 * - Logs a success message upon completion.
 * - Catches and logs any errors that occur during the update process.
 * - Ensures proper disconnection from the Prisma client in the `finally` block.
 */
export const resetFreeDownloads = async () => {
  try {
    await prisma.user.updateMany({
      data: { freeDownloads: 3 },
    });
    console.log('Successfully reset freeDownloads for all users.');
  } catch (error) {
    console.error('Error resetting freeDownloads:', error);
  } finally {
    await prisma.$disconnect();
  }
};

/**
 * Deletes a user account and related records from the database.
 * @param {Request} req - The request object containing the authenticated user's ID.
 * @param {Response} res - The response object to send back the result of the deletion process.
 * @returns {Promise<Response>} - A response indicating whether the user account was successfully deleted or if an error occurred.
 * - Verifies if the user exists in the database.
 * - Deletes the user along with related records (`templates`, `downloadHistory`) using cascading deletion.
 * - Sends a success message if the user is deleted.
 * - Handles any errors that occur during the deletion process and returns an appropriate error message.
 */
export const deleteUser = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId
      }
    })
    if (!user) {
      return res.status(400).json({ message: 'User not exist' });
    }

    await prisma.user.delete({
      where: { id: userId },
      include: { templates: true, downloadHistory: true }
    })

    return res.status(200).json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: 'Failed to delete user account' });
  }
};
