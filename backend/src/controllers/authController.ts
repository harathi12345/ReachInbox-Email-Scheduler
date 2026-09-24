import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import prisma from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { issueToken } from "../middleware/auth";

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const publicUser = (user: { id: string; name: string; email: string; role: string }) => ({ id: user.id, name: user.name, email: user.email, role: user.role });

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body ?? {};
  if (typeof name !== "string" || !name.trim()) throw Object.assign(new Error("Name is required."), { statusCode: 400 });
  if (typeof email !== "string" || !validEmail(email.trim())) throw Object.assign(new Error("A valid email is required."), { statusCode: 400 });
  if (typeof password !== "string" || password.length < 8) throw Object.assign(new Error("Password must be at least 8 characters."), { statusCode: 400 });

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing?.passwordHash) throw Object.assign(new Error("An account with this email already exists."), { statusCode: 409 });

  const user = existing
    ? await prisma.user.update({ where: { id: existing.id }, data: { name: name.trim(), passwordHash: await bcrypt.hash(password, 12) } })
    : await prisma.user.create({ data: { name: name.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12) } });

  const safeUser = publicUser(user);
  res.status(201).json({ success: true, data: { user: safeUser, token: issueToken({ id: user.id, email: user.email }) } });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") throw Object.assign(new Error("Email and password are required."), { statusCode: 400 });

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  const passwordMatches = user?.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !passwordMatches) throw Object.assign(new Error("Invalid email or password."), { statusCode: 401 });

  const safeUser = publicUser(user);
  res.status(200).json({ success: true, data: { user: safeUser, token: issueToken({ id: user.id, email: user.email }) } });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: { message: "Signed out successfully." } });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.authUser?.id } });
  if (!user) throw Object.assign(new Error("User not found."), { statusCode: 401 });
  res.status(200).json({ success: true, data: publicUser(user) });
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const { name, email } = req.body ?? {};
  if (typeof name !== "string" || !name.trim()) throw Object.assign(new Error("Name is required."), { statusCode: 400 });
  if (typeof email !== "string" || !validEmail(email.trim())) throw Object.assign(new Error("A valid email is required."), { statusCode: 400 });

  const normalizedEmail = email.trim().toLowerCase();
  const duplicate = await prisma.user.findFirst({ where: { email: normalizedEmail, NOT: { id: req.authUser?.id } } });
  if (duplicate) throw Object.assign(new Error("That email is already in use."), { statusCode: 409 });

  const user = await prisma.user.update({ where: { id: req.authUser?.id }, data: { name: name.trim(), email: normalizedEmail } });
  res.status(200).json({ success: true, data: publicUser(user) });
});