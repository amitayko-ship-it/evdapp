import nodemailer from "nodemailer";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

// Microsoft Outlook / Office 365 SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.OUTLOOK_SMTP_HOST || "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.OUTLOOK_EMAIL,
    pass: process.env.OUTLOOK_PASSWORD,
  },
  tls: {
    ciphers: "SSLv3",
  },
});

export async function sendEmail(options: EmailOptions): Promise<void> {
  const mailOptions = {
    from: `"אבן דרך" <${process.env.OUTLOOK_EMAIL}>`,
    to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  };

  await transporter.sendMail(mailOptions);
}

export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error("Email connection failed:", error);
    return false;
  }
}
