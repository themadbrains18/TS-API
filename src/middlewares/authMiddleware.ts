import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload as BaseJwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

/**
 * Extending the Express Request Interface to Include a User Property.
 * 
 * This declaration extends the default `Request` interface from the `express-serve-static-core` module to include an optional `user` property. This is useful for attaching the decoded JWT payload to the `Request` object after user authentication.
 * 
 * - `user`: An optional property that stores the decoded JWT payload, typically added after verifying the token in a middleware function. The type `JwtPayload` represents the structure of the decoded JWT (which should be defined elsewhere in the project to match the expected payload structure).
 * 
 * This extension allows you to access `req.user` in your route handlers and middlewares, making it easier to work with authenticated user data throughout your application.
 */
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload; // Optional user property that stores decoded JWT payload
  }
}



/**
 * JwtPayload Interface.
 * 
 * This interface defines the structure of the JWT (JSON Web Token) payload after it has been decoded. It extends a base payload structure (`BaseJwtPayload`), which may contain additional common fields such as `iat` (issued at) and `exp` (expiration time).
 * 
 * The `JwtPayload` interface includes the following fields:
 * 
 * - `id`: A string representing the unique identifier of the user, extracted from the JWT.
 * - `email`: A string representing the email address of the user, also extracted from the JWT.
 * 
 * This payload structure is commonly used after JWT authentication to identify and authorize users in the application. The interface can be extended if additional fields are needed.
 */
interface JwtPayload extends BaseJwtPayload {
  id: string;  
  email: string;
}



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
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer token format

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized access, no token provided' });
  }

  try {
    // Verify the token and extract the payload
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Attach the decoded payload (user info) to the request object
    req.user = decoded;

    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}
