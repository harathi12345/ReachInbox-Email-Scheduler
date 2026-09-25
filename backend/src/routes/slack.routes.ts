import { Router } from "express";
import { disconnectSlack, getSlackStatus, slackCallback, slackLogin } from "../controllers/slackController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/auth/slack", slackLogin);
router.get("/slack", slackLogin);
router.get("/auth/slack/callback", slackCallback);
router.get("/slack/callback", slackCallback);

router.get("/api/slack/status", authMiddleware, getSlackStatus);
router.post("/api/slack/disconnect", authMiddleware, disconnectSlack);

export default router;
