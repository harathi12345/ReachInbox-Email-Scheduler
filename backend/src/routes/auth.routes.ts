import { Router } from "express";
import { login, logout, me, register, updateMe } from "../controllers/authController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/logout", authMiddleware, logout);
router.get("/auth/me", authMiddleware, me);
router.put("/auth/me", authMiddleware, updateMe);

export default router;