import nodemailer from "nodemailer";
import type { Email } from "@prisma/client";

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const cleanEnvStr = (val?: string) => {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "");
};

const getTransporter = () => {
  const host = cleanEnvStr(process.env.SMTP_HOST);
  const rawPort = cleanEnvStr(process.env.SMTP_PORT);
  const port = parseInt(rawPort || "587", 10) || 587;
  const user = cleanEnvStr(process.env.SMTP_USER);
  const password = cleanEnvStr(process.env.SMTP_PASSWORD);

  if (!host || !user || !password) {
    throw new Error("SMTP configuration is missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD in your environment.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 20000,
  });
};

export const verifySmtpTransporter = async () => {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log("[SMTP] Transporter verification successful.");
    return true;
  } catch (error: any) {
    console.error("[SMTP] Transporter verification warning:", error?.message || String(error));
    return false;
  }
};

export const sendEmail = async (email: Email) => {
  const transporter = getTransporter();
  const smtpUser = cleanEnvStr(process.env.SMTP_USER);

  let fromAddress = smtpUser;
  if (email.sender && email.sender.trim()) {
    const trimmedSender = email.sender.trim();
    if (validEmail(trimmedSender)) {
      fromAddress = trimmedSender;
    } else {
      fromAddress = `"${trimmedSender}" <${smtpUser}>`;
    }
  }

  const info = await transporter.sendMail({
    from: fromAddress,
    to: email.to,
    subject: email.subject,
    text: email.body,
    html: `<p>${email.body.replace(/\n/g, "<br />")}</p>`,
  });

  return info;
};
