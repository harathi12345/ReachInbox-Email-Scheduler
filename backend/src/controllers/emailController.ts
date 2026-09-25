import type { Request, Response } from "express";
import prisma from "../config/prisma";
import { indexEmailDocument, esClient, ELASTICSEARCH_INDEX, updateEmailDocumentStatus } from "../config/elasticsearch";
import { emailQueue } from "../queues/emailQueue";
import { asyncHandler } from "../utils/asyncHandler";

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const ensureUser = async (body: { userId?: string; userEmail?: string; userName?: string }) => {
  if (body.userId) {
    const existingUser = await prisma.user.findUnique({ where: { id: body.userId } });
    if (existingUser) {
      return existingUser;
    }
  }

  const email = body.userEmail || "admin@reachinbox.local";

  return prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: body.userName || "ReachInbox User",
      email,
    },
  });
};

export const createEmail = asyncHandler(async (req: Request, res: Response) => {
  const { to, subject, body, sender, scheduledAt, delayBetweenEmails, hourlyLimit, userId, userEmail, userName } = req.body ?? {};

  if (!to || typeof to !== "string" || !validEmail(to.trim())) {
    throw Object.assign(new Error("A valid recipient email is required."), { statusCode: 400 });
  }

  if (!subject || typeof subject !== "string" || !subject.trim()) {
    throw Object.assign(new Error("Subject is required."), { statusCode: 400 });
  }

  if (!body || typeof body !== "string" || !body.trim()) {
    throw Object.assign(new Error("Email body is required."), { statusCode: 400 });
  }

  if (!scheduledAt || typeof scheduledAt !== "string") {
    throw Object.assign(new Error("scheduledAt is required."), { statusCode: 400 });
  }

  const scheduledDate = new Date(scheduledAt);
  if (Number.isNaN(scheduledDate.getTime())) {
    throw Object.assign(new Error("A valid scheduledAt value is required."), { statusCode: 400 });
  }

  const now = new Date();
  if (scheduledDate.getTime() < now.getTime() - 5000) {
    throw Object.assign(new Error("scheduledAt must be now or a future date."), { statusCode: 400 });
  }

  const user = await ensureUser({ userId: req.authUser?.id || userId, userEmail, userName });
  const email = await prisma.email.create({
    data: {
      userId: user.id,
      to: to.trim(),
      sender: sender ? sender.trim() : null,
      subject: subject.trim(),
      body: body.trim(),
      scheduledAt: scheduledDate,
      status: "SCHEDULED",
    },
  });

  const delayConfig = Number(delayBetweenEmails) || Number(process.env.EMAIL_MIN_DELAY_MS) || 1000;
  const hourlyLimitConfig = Number(hourlyLimit) || Number(process.env.MAX_EMAILS_PER_HOUR) || 100;

  const delay = Math.max(0, scheduledDate.getTime() - now.getTime());

  try {
    console.log(`[Queue] Adding job: ${email.id} (Delay: ${delay}ms)`);
    await emailQueue.add(
      "send-email",
      { emailId: email.id, delayBetweenEmails: delayConfig, hourlyLimit: hourlyLimitConfig },
      { jobId: email.id, delay }
    );
    // Index explicitly asynchronously to avoid delaying the API response maliciously
    indexEmailDocument(email).catch(() => {});
  } catch (error) {
    await prisma.email.update({ where: { id: email.id }, data: { status: "FAILED" } });
    updateEmailDocumentStatus(email.id, { status: "FAILED" }).catch(() => {});
    throw error;
  }

  res.status(201).json({
    success: true,
    data: email,
  });
});

export const listEmails = asyncHandler(async (req: Request, res: Response) => {
  const emails = await prisma.email.findMany({
    where: { userId: req.authUser?.id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  res.status(200).json({ success: true, data: emails });
});

export const getEmailById = asyncHandler(async (req: Request, res: Response) => {
  const emailId = String(req.params.id);
  const email = await prisma.email.findFirst({
    where: { id: emailId, userId: req.authUser?.id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!email) {
    throw Object.assign(new Error("Email not found."), { statusCode: 404 });
  }

  res.status(200).json({ success: true, data: email });
});

export const cancelEmail = asyncHandler(async (req: Request, res: Response) => {
  const emailId = String(req.params.id);
  const email = await prisma.email.findFirst({ where: { id: emailId, userId: req.authUser?.id } });

  if (!email) {
    throw Object.assign(new Error("Email not found."), { statusCode: 404 });
  }

  if (email.status !== "SCHEDULED") {
    throw Object.assign(new Error("Only scheduled emails can be cancelled."), { statusCode: 409 });
  }

  await emailQueue.remove(emailId);

  const updatedEmail = await prisma.email.update({
    where: { id: emailId },
    data: { status: "CANCELLED" },
  });

  updateEmailDocumentStatus(emailId, { status: "CANCELLED" }).catch(() => {});

  res.status(200).json({
    success: true,
    data: updatedEmail,
  });
});

export const deleteEmail = asyncHandler(async (req: Request, res: Response) => {
  const emailId = String(req.params.id);
  const email = await prisma.email.findFirst({ where: { id: emailId, userId: req.authUser?.id } });

  if (!email) {
    throw Object.assign(new Error("Email not found."), { statusCode: 404 });
  }

  await emailQueue.remove(emailId);
  await prisma.email.delete({ where: { id: emailId } });

  updateEmailDocumentStatus(emailId, { status: "DELETED" }).catch(() => {});

  res.status(204).send();
});

export const searchEmails = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query.q as string;
  const statusFilter = req.query.status as string;

  let mustQueries: any[] = [];
  
  if (q) {
    mustQueries.push({
      multi_match: {
        query: q,
        fields: ["recipient", "sender", "subject", "body", "status", "id"]
      }
    });
  }

  if (statusFilter) {
    mustQueries.push({
      term: { status: statusFilter }
    });
  }

  if (mustQueries.length === 0) {
    mustQueries.push({ match_all: {} });
  }

  try {
    const response = await esClient.search({
      index: ELASTICSEARCH_INDEX,
      query: {
         bool: {
           must: mustQueries
         }
      },
      sort: [
         { createdAt: { order: "desc" } }
      ]
    });

    const hits = response.hits.hits;
    const items = hits.map((hit: any) => hit._source);

    res.status(200).json({
      success: true,
      results: items,
      total: typeof response.hits.total === "number" ? response.hits.total : response.hits.total?.value || 0
    });
  } catch (error: any) {
    console.error("[Elasticsearch] Search failed:", error.message);
    res.status(200).json({ success: true, results: [], total: 0 });
  }
});
