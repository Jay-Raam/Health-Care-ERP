import nodemailer from 'nodemailer';
import { config } from '../../config/index.js';
import { logger } from '../logs/logger.js';

let transporter: nodemailer.Transporter | null = null;

export const getEmailTransporter = (): nodemailer.Transporter => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS
    }
  });

  transporter.verify((err) => {
    if (err) {
      logger.error('Nodemailer SMTP connection verification failed: ' + err.message);
    } else {
      logger.info('Nodemailer SMTP transporter verified successfully');
    }
  });

  return transporter;
};

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendMail = async (options: SendEmailOptions): Promise<void> => {
  try {
    const client = getEmailTransporter();
    const mailOptions = {
      from: config.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || 'This email requires HTML view.'
    };
    
    const info = await client.sendMail(mailOptions);
    logger.info({ messageId: info.messageId, to: options.to }, 'Email sent successfully via SMTP');
  } catch (err: any) {
    logger.error({ err, to: options.to }, 'Failed to send email');
    throw err;
  }
};

// Ready-made HTML templates
export const templates = {
  welcome: (name: string) => `
    <h1>Welcome to AI Hospital, ${name}!</h1>
    <p>We are glad to have you. Your patient file has been securely initialized.</p>
  `,
  otp: (otp: string) => `
    <h2>AI Hospital - Secure Access OTP</h2>
    <p>Your One-Time Password (OTP) for verification is: <strong>${otp}</strong></p>
    <p>This OTP is valid for 5 minutes. Do not share it with anyone.</p>
  `,
  appointmentConfirm: (patientName: string, doctorName: string, date: string, time: string) => `
    <h2>Appointment Confirmed!</h2>
    <p>Dear ${patientName},</p>
    <p>Your appointment with <strong>Dr. ${doctorName}</strong> is confirmed for <strong>${date}</strong> at <strong>${time}</strong>.</p>
  `,
  invoice: (patientName: string, amount: number, invoiceId: string) => `
    <h2>Invoice Generated - AI Hospital</h2>
    <p>Dear ${patientName},</p>
    <p>A new invoice (ID: ${invoiceId}) has been generated for your recent treatment. Total amount due: <strong>$${amount.toFixed(2)}</strong>.</p>
  `
};
