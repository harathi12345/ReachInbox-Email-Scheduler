import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";

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

const demoModeEnabled = () => process.env.DEMO_MODE === "true";

const getDemoUser = async () => prisma.user.upsert({
  where: { email: process.env.DEMO_USER_EMAIL || "demo@reachinbox.local" },
  update: {},
  create: {
    name: "ReachInbox Demo",
    email: process.env.DEMO_USER_EMAIL || "demo@reachinbox.local",
    role: "DEMO",
  },
});

export const issueToken = (user: AuthUser) => jwt.sign(user, getJwtSecret(), { expiresIn: "7d" });

export const authMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    if (demoModeEnabled()) {
      try {
        const demoUser = await getDemoUser();
        req.authUser = { id: demoUser.id, email: demoUser.email };
        next();
      } catch (error) {
        next(error);
      }
      return;
    }

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