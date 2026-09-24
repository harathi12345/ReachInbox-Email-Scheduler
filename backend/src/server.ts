import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import emailRoutes from "./routes/email.routes";
import healthRoutes from "./routes/health.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authMiddleware } from "./middleware/auth";
import { createEmailWorker } from "./workers/emailWorker";

const app = express();
const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api", authRoutes);
app.use("/api", authMiddleware, emailRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const worker = createEmailWorker();

worker.on("ready", () => {
  console.log("Email worker is ready");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});