import { Queue } from "bullmq";
import { createRedisConnection } from "../config/redis";

const connection = createRedisConnection("queue");

export const emailQueue = new Queue("email-scheduler", { connection });

emailQueue.on("error", (error) => {
  console.error("[queue] error", error.message);
});
