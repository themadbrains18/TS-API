import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/routes';

/**
 * Load environment variables from .env file
 */
dotenv.config();

/**
 * Create an instance of the Express application
 */
const app = express();

/**
 * Middleware for enabling Cross-Origin Resource Sharing (CORS)
 * This allows the server to accept requests from different origins
 */
app.use(cors());

/**
 * Middleware for parsing incoming JSON requests and adding the parsed data to the request body
 */
app.use(express.json());

/**
 * Use the router for handling requests at the /api path
 * The routes are defined in the 'routes/routes.ts' file
 */
app.use('/apits', router);

export default app;
