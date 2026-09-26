import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import axios from "axios";
import prisma from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";

const cleanEnvStr = (val?: string) => {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "");
};

const getClientOrigin = () => {
  const origin = process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:5173";
  return origin.replace(/\/$/, "");
};

export const slackLogin = asyncHandler(async (req: Request, res: Response) => {
  const SLACK_CLIENT_ID = cleanEnvStr(process.env.SLACK_CLIENT_ID);
  const defaultCallback = `${req.protocol}://${req.get("host")}/auth/slack/callback`;
  const SLACK_REDIRECT_URI = cleanEnvStr(process.env.SLACK_REDIRECT_URI) || defaultCallback;

  if (!SLACK_CLIENT_ID) {
    console.error("[Slack Auth] SLACK_CLIENT_ID environment variable is missing.");
    return res.redirect(
      `${getClientOrigin()}/slack?error=${encodeURIComponent(
        "Slack OAuth configuration is missing on the server. Please set SLACK_CLIENT_ID and SLACK_CLIENT_SECRET in environment variables."
      )}`
    );
  }

  const token = (req.query.token as string) || (req.header("authorization")?.replace(/^Bearer\s+/, "")) || req.cookies?.token;
  
  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&user_scope=chat:write&redirect_uri=${encodeURIComponent(SLACK_REDIRECT_URI)}&state=${encodeURIComponent(token || "no-token")}`;
  res.redirect(authUrl);
});

export const slackCallback = asyncHandler(async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const SLACK_CLIENT_ID = cleanEnvStr(process.env.SLACK_CLIENT_ID);
  const SLACK_CLIENT_SECRET = cleanEnvStr(process.env.SLACK_CLIENT_SECRET);
  const defaultCallback = `${req.protocol}://${req.get("host")}/auth/slack/callback`;
  const SLACK_REDIRECT_URI = cleanEnvStr(process.env.SLACK_REDIRECT_URI) || defaultCallback;

  if (!code || !SLACK_CLIENT_ID || !SLACK_CLIENT_SECRET) {
    return res.status(400).send("Invalid Slack authorization callback request. Missing code or client credentials.");
  }

  const getClientOrigin = () => {
    const origin = process.env.CLIENT_ORIGIN || process.env.FRONTEND_URL || process.env.CORS_ORIGIN || "http://localhost:5173";
    return origin.replace(/\/$/, "");
  };

  let userId = null;
  try {
    if (state && state !== "no-token") {
      const decoded: any = jwt.verify(state, process.env.JWT_SECRET || "default_secret");
      userId = decoded.id;
    }
  } catch (error) {
    console.error("Slack Auth error verifying state token", error);
    const redirectUrl = `${getClientOrigin()}/dashboard?error=${encodeURIComponent("Invalid session state token for Slack authorization.")}`;
    console.log("[SLACK CALLBACK] redirecting to:", redirectUrl);
    return res.redirect(redirectUrl);
  }

  if (!userId) {
    const redirectUrl = `${getClientOrigin()}/dashboard?error=${encodeURIComponent("User context missing for Slack OAuth.")}`;
    console.log("[SLACK CALLBACK] redirecting to:", redirectUrl);
    return res.redirect(redirectUrl);
  }

  try {
    const tokenResponse = await axios.post("https://slack.com/api/oauth.v2.access", null, {
      params: {
        client_id: SLACK_CLIENT_ID,
        client_secret: SLACK_CLIENT_SECRET,
        code,
        redirect_uri: SLACK_REDIRECT_URI
      }
    });

    const { authed_user, team } = tokenResponse.data;
    if (!tokenResponse.data.ok || !authed_user?.access_token) {
      console.error("Slack OAuth response:", tokenResponse.data);
      const redirectUrl = `${getClientOrigin()}/dashboard?error=${encodeURIComponent("Slack authentication failed.")}`;
      console.log("[SLACK CALLBACK] redirecting to:", redirectUrl);
      return res.redirect(redirectUrl);
    }

    const { access_token } = authed_user;

    await prisma.slackConnection.upsert({
      where: { userId },
      update: {
        teamId: team?.id,
        teamName: team?.name,
        slackUserId: authed_user.id,
        accessToken: access_token,
        active: true
      },
      create: {
        userId,
        teamId: team?.id,
        teamName: team?.name,
        slackUserId: authed_user.id,
        accessToken: access_token,
        active: true
      }
    });

    const redirectUrl = `${getClientOrigin()}/dashboard?slack=connected`;
    console.log("[SLACK CALLBACK] redirecting to:", redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Slack Auth Error:", error);
    const redirectUrl = `${getClientOrigin()}/dashboard?error=${encodeURIComponent("Slack authentication error.")}`;
    console.log("[SLACK CALLBACK] redirecting to:", redirectUrl);
    res.redirect(redirectUrl);
  }
});

export const getSlackStatus = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.authUser?.id;
  if (!userId) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });

  const conn = await prisma.slackConnection.findUnique({ where: { userId } });
  res.status(200).json({ connected: !!(conn && conn.active) });
});

export const disconnectSlack = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.authUser?.id;
  if (!userId) throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });

  await prisma.slackConnection.updateMany({
    where: { userId },
    data: { active: false }
  });

  res.status(200).json({ success: true, message: "Slack disconnected" });
});
