import nodemailer from "nodemailer";

export type SendEmailInput = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
};

let transporter: nodemailer.Transporter | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is missing`);
  }

  return value;
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const host = getRequiredEnv("SMTP_HOST");
  const portValue = getRequiredEnv("SMTP_PORT");
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  const port = Number(portValue);

  if (!Number.isFinite(port)) {
    throw new Error("SMTP_PORT must be a valid number");
  }

  const secure = process.env.SMTP_SECURE === "true";

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  return transporter;
}

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.FROM_EMAIL);
}

export async function sendEmail(input: SendEmailInput) {
  const from = input.from ?? getRequiredEnv("FROM_EMAIL");

  return getTransporter().sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

export async function verifyEmailConnection() {
  return getTransporter().verify();
}
