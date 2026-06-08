import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({
      from: `"Quicksave App" <${env.SMTP_FROM}>`,
      to,
      subject,
      html,
    });
    logger.info({ to }, 'Email sent successfully');
  } catch (error) {
    logger.error({ err: error, to }, 'Failed to send email');
  }
};