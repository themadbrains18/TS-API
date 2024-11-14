"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes/routes"));
/**
 * Load environment variables from .env file
 */
dotenv_1.default.config();
/**
 * Create an instance of the Express application
 */
const app = (0, express_1.default)();
/**
 * Middleware for enabling Cross-Origin Resource Sharing (CORS)
 * This allows the server to accept requests from different origins
 */
app.use((0, cors_1.default)());
/**
 * Middleware for parsing incoming JSON requests and adding the parsed data to the request body
 */
app.use(express_1.default.json());
/**
 * Use the router for handling requests at the /api path
 * The routes are defined in the 'routes/routes.ts' file
 */
app.use('/apits', routes_1.default);
exports.default = app;
