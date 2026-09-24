import type { Request, Response } from "express";
import { getDashboardStats, getRecentEmails } from "../services/dashboardService";
import { asyncHandler } from "../utils/asyncHandler";

export const getDashboardStatsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await getDashboardStats(_req.authUser?.id);
  res.status(200).json({ success: true, data: stats });
});

export const getRecentEmailsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const emails = await getRecentEmails(_req.authUser?.id);
  res.status(200).json({ success: true, data: emails });
});
