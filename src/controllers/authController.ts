import { Request, Response, Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../server';
import crypto from 'crypto';
import { User, Otp } from '@prisma/client';
import { sendOtpEmail } from '../services/nodeMailer';
import { deleteFileFromFirebase, uploadFileToFirebase } from '../services/fileService';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const TOKEN_EXPIRY = '8h'; // JWT Token expires in 8 hours

// Generate JWT Token
function generateToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// Generate a random 6-digit OTP
function generateOtp(): string {
  // return crypto.randomInt(100000, 999999).toString();
  return '123456'
}

// Set OTP expiration time (e.g., 10 minutes from now)
function otpExpiryTime(): Date {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);
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


// ================================== Register User ==================================
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


    if (!otp) {
      const otpCode = generateOtp();
      const expiresAt = otpExpiryTime();

      await prisma.otp.create({
        data: { email: email, code: otpCode, expiresAt },
      });

      await sendOtpEmail(email, otpCode);


    }
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists. Please log in.' });
    }
    if (otp) {
      const verificationResponse = await verifyOtp(req);

      console.log(verificationResponse, "==response");

      // Check if OTP verification was successful
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


// ================================== Login User ==================================
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
            data: { id: user.id, email: user.email, role: user.role, name: user.name,image:user.profileImg, freeDownloads:user.freeDownloads, number:user.number }
          }
        });
      } else {
        console.log("herer",verificationResponse.status);
        
        return res.status(verificationResponse.status).json({message:verificationResponse.message});
      }


    }

  } catch (error: any) {
    console.error(error);
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


// ================================================================================================
// -------------------------------------- Reset Password with OTP ---------------------------------
// ================================================================================================
export async function resetPasswordWithOtp(req: Request, res: Response) {
  const { email, otp, newPassword, confirmPassword }: { email: string; otp: string; newPassword: string; confirmPassword: string } = req.body;

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


      return res.status(200).json({ message: 'Password reset successfully.' });
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

// ================================================================================================
// -------------------------------------- Verify OTP ----------------------------------------------
// ================================================================================================
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

// export async function getUserDownloads(req: Request, res: Response) {
//   try {
//     // Confirm if user information is populated in the request object
//     if (!req.user || !req.user.id) {
//       console.error("User not authenticated or user ID missing");
//       return res.status(401).json({ message: "Unauthorized: User not authenticated" });
//     }

//     const userId = req.user.id;
//     const page = parseInt(req.query.page as string) || 1; // Default to page 1
//     const limit = 6; // Items per page
//     const offset = (page - 1) * limit;


//     // Fetch total count for pagination
//     const totalCount = await prisma.downloadHistory.count({
//       where: { userId },
//     });

//     // Fetch the download history with pagination
//     const userDownloads = await prisma.downloadHistory.findMany({
//       where: { userId },
//       include: {
//         template: {
//           select: {
//             title: true,
//             price: true,
//             sliderImages: true,
//             sourceFiles: true,
//           },
//         },
//       },
//       skip: offset,
//       take: limit,
//     });

//     // Calculate total pages
//     const totalPages = Math.ceil(totalCount / limit);

//     return res.status(200).json({
//       downloads: userDownloads,
//       pagination: {
//         page,
//         limit,
//         totalPages,
//         totalCount,
//       },
//     });
//   } catch (error: any) {
//     console.error("Error fetching user downloads:", error);
//     return res.status(500).json({ message: "Server error", error: error.message });
//   }
// }

// working

// export async function getUserDownloads(req: Request, res: Response) {
//   try {
//     if (!req.user || !req.user.id) {
//       console.error("User not authenticated or user ID missing");
//       return res.status(401).json({ message: "Unauthorized: User not authenticated" });
//     }

//     const userId = req.user.id;
//     const page = parseInt(req.query.page as string) || 1; // Default to page 1
//     const limit = 6; // Items per page
//     const offset = (page - 1) * limit;
//     const sort = req.query.sort as string; // Sort parameter from query
//     let dateFilter: Date | undefined;

//     // Calculate the date filter based on the selected sort option
//     const currentDate = new Date();
//     switch (sort) {
//       case 'Last Day':
//         dateFilter = new Date(currentDate);
//         dateFilter.setDate(currentDate.getDate() - 1);
//         break;
//       case 'Last 7 Day':
//         dateFilter = new Date(currentDate);
//         dateFilter.setDate(currentDate.getDate() - 7);
//         break;
//       case 'Last 30 Day':
//         dateFilter = new Date(currentDate);
//         dateFilter.setDate(currentDate.getDate() - 30);
//         break;
//       case 'Last Quarter':
//         dateFilter = new Date(currentDate);
//         dateFilter.setMonth(currentDate.getMonth() - 3);
//         break;
//       case 'Last Year':
//         dateFilter = new Date(currentDate);
//         dateFilter.setFullYear(currentDate.getFullYear() - 1);
//         break;
//       default:
//         dateFilter = undefined; // No filter applied if no sort matches
//     }

//     // Log for debugging
//     console.log("Date filter applied:", dateFilter);

//     // Count total downloads based on date filter
//     const totalCount = await prisma.downloadHistory.count({
//       where: {
//         userId,
//         ...(dateFilter && { downloadedAt: { gte: dateFilter } }), // Apply date filter if present
//       },
//     });

//     // Fetch downloads based on date filter and pagination
//     const userDownloads = await prisma.downloadHistory.findMany({
//       where: {
//         userId,
//         ...(dateFilter && { downloadedAt: { gte: dateFilter } }), // Apply date filter if present
//       },
//       include: {
//         template: {
//           select: {
//             title: true,
//             price: true,
//             sliderImages: true,
//             sourceFiles: true,

//           },
//         },
//       },
//       skip: offset,
//       take: limit,
//     });

//     // Calculate total pages
//     const totalPages = Math.ceil(totalCount / limit);

//     return res.status(200).json({
//       downloads: userDownloads,
//       pagination: {
//         page,
//         limit,
//         totalPages,
//         totalCount,
//       },
//     });
//   } catch (error: any) {
//     console.error("Error fetching user downloads:", error);
//     return res.status(500).json({ message: "Server error", error: error.message });
//   }
// }


// Assuming this is your Prisma client instance

// export async function getUserDownloads(req: Request, res: Response) {
//   try {
//     if (!req.user || !req.user.id) {
//       console.error("User not authenticated or user ID missing");
//       return res.status(401).json({ message: "Unauthorized: User not authenticated" });
//     }

//     const userId = req.user.id;
//     const page = parseInt(req.query.page as string) || 1;
//     const limit = 6;
//     const offset = (page - 1) * limit;
//     const selectedSort = req.query.sort as string || 'Last Day';
//     const selectedCategory = req.query.category as string || 'All';

//     // Determine the date range filter based on selectedSort
//     let dateFilter = {};
//     const today = new Date();
//     if (selectedSort === 'Last Day') {
//       dateFilter = { downloadedAt: { gte: new Date(today.setDate(today.getDate() - 1)) } };
//     } else if (selectedSort === 'Last 7 Day') {
//       dateFilter = { downloadedAt: { gte: new Date(today.setDate(today.getDate() - 7)) } };
//     } else if (selectedSort === 'Last 30 Day') {
//       dateFilter = { downloadedAt: { gte: new Date(today.setDate(today.getDate() - 30)) } };
//     } else if (selectedSort === 'Last Quarter') {
//       dateFilter = { downloadedAt: { gte: new Date(today.setMonth(today.getMonth() - 3)) } };
//     } else if (selectedSort === 'Last Year') {
//       dateFilter = { downloadedAt: { gte: new Date(today.setFullYear(today.getFullYear() - 1)) } };
//     }

//     // Determine the category filter based on selectedCategory
//     let categoryFilter = {};
//     if (selectedCategory === 'Free Download') {
//       categoryFilter = { template: { price: 0 } };
//     } else if (selectedCategory === 'Premium') {
//       categoryFilter = { template: { price: { gt: 0 } } };
//     }

//     // Combine filters for the query
//     const filters = { userId, ...dateFilter, ...categoryFilter };

//     const totalCount = await prisma.downloadHistory.count({ where: filters });
//     const userDownloads = await prisma.downloadHistory.findMany({
//       where: filters,
//       include: {
//         template: {
//           select: {
//             title: true,
//             price: true,
//             sliderImages: true,
//             sourceFiles: true,
//           },
//         },
//       },
//       skip: offset,
//       take: limit,
//     });

//     const totalPages = Math.ceil(totalCount / limit);

//     return res.status(200).json({
//       downloads: userDownloads,
//       pagination: {
//         page,
//         limit,
//         totalPages,
//         totalCount,
//       },
//     });
//   } catch (error: any) {
//     console.error("Error fetching user downloads:", error);
//     return res.status(500).json({ message: "Server error", error: error.message });
//   }
// }


// API to update user details with OTP verification for email change
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
  // // Final Step: If OTP for new email is verified, update user email
  // if (newEmail && !otp) {
  //   const newOtpRecord = await prisma.otp.findUnique({ where: { email: newEmail } });
  //   if (!newOtpRecord || newOtpRecord.code !== otp || newOtpRecord.expiresAt < new Date()) {
  //     return res.status(400).json({ message: "Invalid or expired OTP on new email" });
  //   }

  //   // If OTP is valid, update the email in the user record
  //   updatedData.email = newEmail;
  // }

  // // Update the user record with any other provided details
  // const updatedUser = await prisma.user.update({
  //   where: { id: id },
  //   data: updatedData,
  // });

//   return res.status(200).json({ message: "User details updated successfully", user: updatedUser });
// } catch (error: any) {
//   console.error("Error updating user details:", error);
//   return res.status(500).json({ message: "Failed to update user details", error: error.message });
// }
// }

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
export async function getFreeDownload(req: Request, res: Response) {
  try {
    if (!req.user || !req.user.id) {
      console.error("User not authenticated or user ID missing");
      return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    }

    const userId = req.user.id;
   const count =  await prisma.user.findUnique({where:{id:userId},
  select:{
    freeDownloads:true,
    profileImg:true
  }})

    return res.status(200).json({
      downloads: count
    });
  } catch (error: any) {
    console.error("Error fetching user downloads:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
}



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

export const resetFreeDownloads = async () => {
  try {
    // Update all users, setting freeDownloads to 3
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


// Delete user account by ID
export const deleteUser = async (req:Request, res:Response) => {
  const { id } = req.params;

  try {
    // Delete the user and cascade deletion to related records
    await prisma.user.delete({
      where: { id },
    });

    return res.status(200).json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: 'Failed to delete user account' });
  }
};
