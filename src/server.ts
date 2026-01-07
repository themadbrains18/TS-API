import app from './app';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import express from "express";
import cron from 'node-cron';
import { resetFreeDownloads } from './controllers/authController';

/**
 * Load environment variables from .env file
 * Using explicit path to ensure .env is loaded from TS-API directory
 */
import path from 'path';

// Load .env from TS-API directory (where server.ts is located)
const envPath = path.resolve(process.cwd(), '.env');
console.log('📁 Loading .env from:', envPath);
dotenv.config({ path: envPath });

// Debug: Check if SMTP variables are loaded
console.log('📧 SMTP Configuration Check:');
const smtpUser = process.env.SMTP_USERNAME || process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
console.log('SMTP_USERNAME/SMTP_USER:', smtpUser ? '✅ Set' : '❌ Missing');
console.log('SMTP_PASSWORD/SMTP_PASS:', smtpPass ? '✅ Set' : '❌ Missing');

/**
 * Create an instance of PrismaClient to manage database connections
 */
const prisma = new PrismaClient();

/**
 * Middleware for parsing JSON requests in Express
 */
app.use(express.json());

/**
 * Define server port, defaulting to 5000 if not specified in .env
 */
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connect to the database using Prisma ORM
    await prisma.$connect();
    console.log('Connected to the database');

    // Start the Express server and listen on the defined port
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    // Handle errors during database connection or server startup
    console.error('Failed to start the server:', error);
    process.exit(1); // Exit the process if there is an error
  }
}

/**
 * Schedule a daily cron job at midnight to reset free downloads
 */
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily freeDownloads reset');
  await resetFreeDownloads();
});

/**
 * Handle graceful shutdown on SIGINT signal (e.g., when pressing Ctrl+C in the terminal)
 */
process.on('SIGINT', async () => {
  // Disconnect from the database to release resources
  await prisma.$disconnect();
  console.log('Disconnected from the database');
  process.exit(0); // Exit process after cleanup
});

/**
 * Start the server by calling the startServer function
 */
startServer();

export default prisma;
