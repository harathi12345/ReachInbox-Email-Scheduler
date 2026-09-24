import { Router } from "express";
import { cancelEmail, createEmail, deleteEmail, getEmailById, listEmails } from "../controllers/emailController";
import { getDashboardStatsHandler, getRecentEmailsHandler } from "../controllers/dashboardController";

const router = Router();

router.post("/emails", createEmail);
router.get("/emails", listEmails);
router.get("/emails/:id", getEmailById);
router.post("/emails/:id/cancel", cancelEmail);
router.delete("/emails/:id", deleteEmail);
router.get("/dashboard/stats", getDashboardStatsHandler);
router.get("/dashboard/recent", getRecentEmailsHandler);

export default router;
