import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import prisma from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import { issueToken } from "../middleware/auth";

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const publicUser = (user: { id: string; name: string; email: string; role: string; avatar?: string | null }) => ({ id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar || null });

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/auth/google/callback";
  
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_ID.trim()) {
    const clientOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
    return res.redirect(
      `${clientOrigin}/login?error=${encodeURIComponent("Google OAuth configuration is missing. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env")}`
    );
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID.trim()}&redirect_uri=${encodeURIComponent(GOOGLE_CALLBACK_URL.trim())}&response_type=code&scope=email profile`;
  res.redirect(authUrl);
});

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/auth/google/callback";

  if (!code || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(400).send("Google OAuth request failed. Missing authorization code or server OAuth credentials.");
  }

  const { default: axios } = await import("axios");

  try {
    const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: GOOGLE_CALLBACK_URL,
      grant_type: "authorization_code"
    });

    const { access_token } = tokenResponse.data;

    const profileResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const profile = profileResponse.data;

    let user = await prisma.user.findUnique({ where: { email: profile.email.toLowerCase() } });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.id, avatar: profile.picture }
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: profile.name,
          email: profile.email.toLowerCase(),
          googleId: profile.id,
          avatar: profile.picture
        }
      });
    }

    const token = issueToken({ id: user.id, email: user.email });

    const clientOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
    res.redirect(`${clientOrigin}/?token=${token}`);
  } catch (error) {
    console.error("Google Auth Error:", error);
    const clientOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
    res.redirect(`${clientOrigin}/login?error=${encodeURIComponent("Google authentication failed. Please try again.")}`);
  }
});

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

export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Since JWT is stateless, logout typically invalidates client-side logic. To actually invalidate on the backend, 
  // you would blacklist the token or use short-lived tokens with refresh tokens. 
  // For standard JWT requirements, just clearing the client cookie/storage is the standard.
  res.status(200).json({ success: true, data: { message: "Signed out successfully." } });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.authUser?.id } });
  if (!user) throw Object.assign(new Error("User not found."), { statusCode: 401 });
  // Ensure the response specifically wraps the user inside a user property as requested by the test script/prompt requirements
  res.status(200).json({ success: true, user: publicUser(user) });
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