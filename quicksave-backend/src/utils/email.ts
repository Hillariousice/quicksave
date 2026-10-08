import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { Resend } from 'resend';
// const transporter = nodemailer.createTransport({
//   host: env.SMTP_HOST,
//   port: env.SMTP_PORT,
//   secure: env.SMTP_PORT === 465, // true for 465, false for other ports
//   auth: {
//     user: env.SMTP_USER,
//     pass: env.SMTP_PASS,
//   },
// });

const resend = new Resend(process.env.RESEND_API_KEY);
export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    // await transporter.sendMail({
    //   from: `"Quicksave App" <${env.SMTP_FROM}>`,
    //   to,
    //   subject,
    //   html,
    // });
    // logger.info({ to }, 'Email sent successfully');
    const data = await resend.emails.send({
      // Resend allows testing with this default onboarding email!
      from: 'Quicksave <onboarding@resend.dev>', 
      to: [to],
      subject: subject,
      html: html,
    });

    logger.info({ to, id: data.data?.id }, 'Email sent successfully via Resend API');
  } catch (error) {
    logger.error({ err: error, to }, 'Failed to send email');
  }
};