import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import axios from "axios";
import prisma from "../config/prisma";
import { asyncHandler } from "../utils/asyncHandler";

export const slackLogin = asyncHandler(async (req: Request, res: Response) => {
  const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
  const SLACK_REDIRECT_URI = process.env.SLACK_REDIRECT_URI;
  if (!SLACK_CLIENT_ID || !SLACK_REDIRECT_URI) {
    throw Object.assign(new Error("Slack OAuth configuration is missing"), { statusCode: 500 });
  }

  // Generate an arbitrary "state" parameter to identify the user when Slack redirects back
  // For standard architectures, passing a JWT token in state is possible, but since the user logs in from the frontend dashboard,
  // we can use a cookie or pass the user ID as state if the endpoint is called with auth.
  // Wait, GET /auth/slack is usually an unauthenticated or authenticated route. If authenticated, we can encode userId in state.
  const token = (req.query.token as string) || (req.header("authorization")?.replace(/^Bearer\s+/, "")) || req.cookies?.token;
  
  const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&user_scope=chat:write&redirect_uri=${encodeURIComponent(SLACK_REDIRECT_URI)}&state=${encodeURIComponent(token || "no-token")}`;
  res.redirect(authUrl);
});

export const slackCallback = asyncHandler(async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID;
  const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET;
  const SLACK_REDIRECT_URI = process.env.SLACK_REDIRECT_URI || "http://localhost:5000/auth/slack/callback";

  if (!code || !SLACK_CLIENT_ID || !SLACK_CLIENT_SECRET) {
    return res.status(400).send("Invalid Slack authorization callback request.");
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
