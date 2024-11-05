import app from './app'; 
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import express from "express"
import cron from 'node-cron';
import { resetFreeDownloads } from './controllers/authController';

dotenv.config(); 

// Create an instance of PrismaClient
const prisma = new PrismaClient();
app.use(express.json())
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connect to the database using Prisma
    await prisma.$connect();
    console.log('Connected to the database');

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    // Log any errors that occur during server startup
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
}
// Schedule the task to run daily at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running daily freeDownloads reset');
  await resetFreeDownloads();
});


// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('Disconnected from the database');
  process.exit(0);
});

// Call the function to start the server
startServer();

export default prisma