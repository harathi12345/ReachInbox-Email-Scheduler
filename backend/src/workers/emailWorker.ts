import { Worker } from "bullmq";
import prisma from "../config/prisma";
import { createRedisConnection } from "../config/redis";
import { sendEmail } from "../services/emailService";
import { emailQueue } from "../queues/emailQueue";
import { updateEmailDocumentStatus } from "../config/elasticsearch";

const redis = createRedisConnection("limiter");

const LUA_SCRIPT = `
local lastSentKey = KEYS[1]
local hourlyKey = KEYS[2]
local now = tonumber(ARGV[1])
local minDelay = tonumber(ARGV[2])
local maxPerHour = tonumber(ARGV[3])
local windowExpiration = tonumber(ARGV[4])

-- Check hourly limit FIRST
local currentCount = redis.call('GET', hourlyKey)
if currentCount and tonumber(currentCount) >= maxPerHour then
  return {"RATE_LIMIT", tonumber(currentCount)}
end

-- Check min delay
local lastSent = redis.call('GET', lastSentKey)
if lastSent then
  local timePassed = now - tonumber(lastSent)
  if timePassed < minDelay then
    return {"DELAY", minDelay - timePassed}
  end
end

-- Success, commit usage!
redis.call('SET', lastSentKey, now)
redis.call('PEXPIRE', lastSentKey, minDelay * 2)

local newCount = redis.call('INCR', hourlyKey)
if newCount == 1 then
  redis.call('EXPIRE', hourlyKey, windowExpiration)
end

return {"OK", newCount}
`;

export const createEmailWorker = () => {
  const worker = new Worker(
    "email-scheduler",
    async (job) => {
      console.log(`[Worker] Processing job: ${job.id}`);
      const email = await prisma.email.findUnique({ where: { id: job.data.emailId } });

      if (!email) {
        throw new Error(`Email not found: ${job.data.emailId}`);
      }

      const claimed = await prisma.email.updateMany({
        where: { id: email.id, status: "SCHEDULED" },
        data: { status: "PROCESSING" },
      });

      if (claimed.count === 0) {
        console.log(`[Worker] Idempotency check: skipping email ${email.id} (status: ${email.status})`);
        return { skipped: true };
      }

      const sender = email.sender || process.env.SMTP_USER || "default";
      const minDelay = Number(job.data.delayBetweenEmails) || Number(process.env.EMAIL_MIN_DELAY_MS) || 2000;
      const maxPerHour = Number(job.data.hourlyLimit) || Number(process.env.MAX_EMAILS_PER_HOUR) || 200;

      const now = new Date();
      const nowMs = now.getTime();
      
      const hourString = now.toISOString().slice(0, 13); // e.g. "2026-09-25T14"
      const hourlyKey = `email-rate:${sender}:${hourString}`;
      const lastSentKey = `email-last-sent:${sender}`;
      
      const nextHour = new Date(now);
      nextHour.setUTCHours(nextHour.getUTCHours() + 1, 0, 0, 0);
      const secondsUntilNextHour = Math.ceil((nextHour.getTime() - nowMs) / 1000);

      const result = await redis.eval(
        LUA_SCRIPT,
        2,
        lastSentKey,
        hourlyKey,
        nowMs,
        minDelay,
        maxPerHour,
        secondsUntilNextHour
      ) as [string, number];

      const [status, data] = result;

      if (status === "RATE_LIMIT") {
        const count = data;
        const delayMs = nextHour.getTime() - nowMs;
        console.log(`[RateLimit] Sender: ${sender}`);
        console.log(`[RateLimit] Current count: ${count}`);
        console.log(`[RateLimit] Limit: ${maxPerHour}`);
        console.log(`[RateLimit] Hourly limit reached`);
        console.log(`[RateLimit] Rescheduling job: ${job.id}`);
        console.log(`[RateLimit] Next available time: ${nextHour.toISOString()}`);

        await prisma.email.update({
          where: { id: email.id },
          data: { status: "SCHEDULED", scheduledAt: nextHour },
        });
        updateEmailDocumentStatus(email.id, { status: "SCHEDULED", scheduledAt: nextHour }).catch(() => {});

        await emailQueue.add("send-email", job.data, {
          jobId: `${email.id}-${nowMs}`,
          delay: delayMs,
        });

        try {
          const slackNotifyKey = `slack-rate-limit:${sender}:${hourString}`;
          // Use Redis NX to ensure only 1 notification goes out per sender per hour
          const alreadyNotified = await redis.set(slackNotifyKey, "1", "EX", 3600, "NX");
          if (alreadyNotified === "OK") {
            const slackConn = await (prisma as any).slackConnection.findUnique({ where: { userId: email.userId } });
            if (slackConn && slackConn.active && slackConn.accessToken && slackConn.slackUserId) {
              const { default: axios } = await import("axios");
              const message = `ReachInbox email rate limit reached.\n\nSender: ${sender}\nHourly limit: ${maxPerHour}\nCurrent window: ${now.getUTCHours()}:00-${nextHour.getUTCHours()}:00\nEmails have been rescheduled for the next available window.`;
              await axios.post("https://slack.com/api/chat.postMessage", {
                channel: slackConn.slackUserId,
                text: message
              }, {
                headers: { Authorization: `Bearer ${slackConn.accessToken}` }
              });
              console.log(`[Slack] Rate limit notification sent to ${slackConn.slackUserId}`);
            }
          }
        } catch (e: any) {
          console.error("[Slack] Failed to send Slack notification:", e.message);
        }

        return { rescheduled: true, reason: "hourly_limit", delayMs };
      }

      if (status === "DELAY") {
        const delayMs = data;
        const newScheduledAt = new Date(nowMs + delayMs);
        console.log(`[Delay] Sender: ${sender}`);
        console.log(`[Delay] Waiting until: ${newScheduledAt.toISOString()}`);

        await prisma.email.update({
          where: { id: email.id },
          data: { status: "SCHEDULED", scheduledAt: newScheduledAt },
        });
        updateEmailDocumentStatus(email.id, { status: "SCHEDULED", scheduledAt: newScheduledAt }).catch(() => {});

        await emailQueue.add("send-email", job.data, {
          jobId: `${email.id}-${nowMs}`,
          delay: delayMs,
        });

        return { rescheduled: true, reason: "delay", delayMs };
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
        updateEmailDocumentStatus(email.id, { status: "SENT", sentAt: new Date() }).catch(() => {});
        console.log(`[Worker] Successfully sent email: ${email.id}`);
        return info;
      } catch (error) {
        await prisma.email.update({
          where: { id: email.id },
          data: { status: "FAILED" },
        });
        updateEmailDocumentStatus(email.id, { status: "FAILED" }).catch(() => {});
        console.error(`[Worker] Failed to send email: ${email.id}`, error);
        throw error;
      }
    },
    { 
      connection: createRedisConnection("worker"),
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || "5", 10),
    }
  );

  worker.on("ready", () => console.log("[worker] ready"));
  worker.on("failed", (job, error) => {
    console.error(`[worker] job failed${job ? ` ${job.id}` : ""}`, error.message);
  });
  worker.on("error", (error) => console.error("[worker] error", error.message));

  return worker;
};
