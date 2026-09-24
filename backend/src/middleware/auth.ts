import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type AuthUser = { id: string; email: string };

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required for authentication.");
  }
  return process.env.JWT_SECRET;
};

export const issueToken = (user: AuthUser) => jwt.sign(user, getJwtSecret(), { expiresIn: "7d" });

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    resUnauthorized(next);
    return;
  }

  try {
    req.authUser = jwt.verify(token, getJwtSecret()) as AuthUser;
    next();
  } catch {
    resUnauthorized(next);
  }
};

const resUnauthorized = (next: NextFunction) => {
  const error = Object.assign(new Error("Authentication is required."), { statusCode: 401 });
  next(error);
};