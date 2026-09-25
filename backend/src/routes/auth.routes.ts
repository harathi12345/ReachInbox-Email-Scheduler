import { Router } from "express";
import { googleCallback, googleLogin, login, logout, me, register, updateMe } from "../controllers/authController";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/auth/google", googleLogin);
router.get("/google", googleLogin);

router.get("/auth/google/callback", googleCallback);
router.get("/google/callback", googleCallback);

router.post("/auth/register", register);
router.post("/register", register);

router.post("/auth/login", login);
router.post("/login", login);

router.post("/auth/logout", authMiddleware, logout);
router.post("/logout", authMiddleware, logout);

router.get("/auth/me", authMiddleware, me);
router.get("/me", authMiddleware, me);

router.put("/auth/me", authMiddleware, updateMe);
router.put("/me", authMiddleware, updateMe);

export default router;