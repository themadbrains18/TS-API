"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
/**
 * Middleware to Authenticate JWT Token.
 *
 * This middleware function checks the `Authorization` header for a valid JWT token, verifies the token's authenticity and extracts the user information from the token's payload. If the token is valid, the user information is attached to the `Request` object, allowing access to protected routes. If the token is missing, invalid, or expired, the middleware returns an appropriate error response.
 *
 * The function follows these steps:
 *
 * 1. **Extract Token**: The token is extracted from the `Authorization` header, which is expected to be in the `Bearer <token>` format.
 * 2. **Missing Token**: If the token is not provided, a `401 Unauthorized` response is returned with a message indicating that no token was provided.
 * 3. **Verify Token**: The token is verified using the secret key (`JWT_SECRET`) and decoded using the `jwt.verify()` method. If the token is valid, the decoded payload (containing user information) is cast to the `JwtPayload` type.
 * 4. **Attach User to Request**: If the token is verified successfully, the user information from the decoded token is attached to the `Request` object as `req.user`.
 * 5. **Error Handling**: If the token is invalid, expired, or if verification fails, a `403 Forbidden` response is returned with a message indicating that the token is either invalid or expired.
 *
 * After the middleware, the request will contain the `user` property (if the token was valid), which can be used by other route handlers for authorization or user-specific logic.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next middleware function to proceed with the request.
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer token format
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized access, no token provided' });
    }
    try {
        // Verify the token and extract the payload
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Attach the decoded payload (user info) to the request object
        req.user = decoded;
        // Proceed to the next middleware or route handler
        next();
    }
    catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
}
