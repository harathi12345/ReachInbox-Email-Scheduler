import nodemailer from "nodemailer";
import type { Email } from "@prisma/client";

const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!host || !user || !password) {
    throw new Error("SMTP configuration is missing. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD in your environment.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: Number(port) === 465,
    auth: { user, pass: password },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });
};

export const sendEmail = async (email: Email) => {
  const transporter = getTransporter();
  const smtpUser = process.env.SMTP_USER || "";

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
