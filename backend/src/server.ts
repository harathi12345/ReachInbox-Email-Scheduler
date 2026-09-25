import "dotenv/config";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import emailRoutes from "./routes/email.routes";
import healthRoutes from "./routes/health.routes";
import slackRoutes from "./routes/slack.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authMiddleware } from "./middleware/auth";
import { emailQueue } from "./queues/emailQueue";
import { createEmailWorker } from "./workers/emailWorker";

const app = express();
const allowedOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

import { initElasticsearch } from "./config/elasticsearch";

const bullBoardAdapter = new ExpressAdapter();
bullBoardAdapter.setBasePath("/admin/queues");
createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter: bullBoardAdapter,
});
app.use("/admin/queues", authMiddleware, bullBoardAdapter.getRouter());

initElasticsearch();

app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api", authRoutes);
app.use("/", authRoutes);
app.use("/api/auth", slackRoutes);
app.use("/api", slackRoutes);
app.use("/", slackRoutes);
app.use("/api", authMiddleware, emailRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const worker = createEmailWorker();

worker.on("ready", () => {
  console.log("Email worker is ready");
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  try {
    await worker.close();
    console.log("Worker closed");
    await emailQueue.close();
    console.log("Queue closed");
    server.close(() => {
      console.log("Express server closed");
      process.exit(0);
    });
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));