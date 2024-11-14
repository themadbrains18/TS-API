"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const node_cron_1 = __importDefault(require("node-cron"));
const authController_1 = require("./controllers/authController");
/**
 * Load environment variables from .env file
 */
dotenv_1.default.config();
/**
 * Create an instance of PrismaClient to manage database connections
 */
const prisma = new client_1.PrismaClient();
/**
 * Middleware for parsing JSON requests in Express
 */
app_1.default.use(express_1.default.json());
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
        app_1.default.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    }
    catch (error) {
        // Handle errors during database connection or server startup
        console.error('Failed to start the server:', error);
        process.exit(1); // Exit the process if there is an error
    }
}
/**
 * Schedule a daily cron job at midnight to reset free downloads
 */
node_cron_1.default.schedule('0 0 * * *', async () => {
    console.log('Running daily freeDownloads reset');
    await (0, authController_1.resetFreeDownloads)();
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
exports.default = prisma;
