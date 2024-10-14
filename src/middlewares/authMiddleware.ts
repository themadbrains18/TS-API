import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload as BaseJwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Extending Express Request interface to include user property
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload; // Optional user property that stores decoded JWT payload
  }
}

// Define the shape of the JWT payload
interface JwtPayload extends BaseJwtPayload {
  id: string;   // The ID of the user from the token
  email: string; // The email of the user from the token
}

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
