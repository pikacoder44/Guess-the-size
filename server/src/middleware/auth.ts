import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: number;
  username: string;
}

/** Extend Express Request to carry the decoded JWT payload */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Optional auth middleware.
 * Parses a Bearer token if present and attaches `req.user`.
 * Calls next() regardless – routes decide whether auth is required.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const secret = process.env.JWT_SECRET!;
      req.user = jwt.verify(token, secret) as JwtPayload;
    } catch {
      // Invalid / expired token – just ignore, treat as guest
    }
  }
  next();
}

/**
 * Strict auth middleware.
 * Returns 401 if no valid token is present.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  optionalAuth(req, res, () => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    next();
  });
}
