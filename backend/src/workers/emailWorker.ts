import { Worker } from "bullmq";
import prisma from "../config/prisma";
import { createRedisConnection } from "../config/redis";
import { sendEmail } from "../services/emailService";

export const createEmailWorker = () => {
  const worker = new Worker(
    "email-scheduler",
    async (job) => {
      const email = await prisma.email.findUnique({ where: { id: job.data.emailId } });

      if (!email) {
        throw new Error(`Email not found: ${job.data.emailId}`);
      }

      const claimed = await prisma.email.updateMany({
        where: { id: email.id, status: "SCHEDULED" },
        data: { status: "PROCESSING" },
      });

      if (claimed.count === 0) {
        return { skipped: true };
      }

      try {
        const info = await sendEmail(email);
        await prisma.email.update({
          where: { id: email.id },
          data: {
            status: "SENT",
            messageId: info.messageId || null,
          },
        });
        return info;
      } catch (error) {
        await prisma.email.update({
          where: { id: email.id },
          data: {
            status: "FAILED",
          },
        });
        throw error;
      }
    },
    { connection: createRedisConnection("worker") },
  );

  worker.on("ready", () => console.log("[worker] ready"));
  worker.on("failed", (job, error) => {
    console.error(`[worker] job failed${job ? ` ${job.id}` : ""}`, error.message);
  });
  worker.on("error", (error) => console.error("[worker] error", error.message));

  return worker;
};
