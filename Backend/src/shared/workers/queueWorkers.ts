import { Worker, Job } from 'bullmq';
import { getRedisClient } from '../cache/redis.js';
import { logger } from '../logs/logger.js';
import { sendMail } from '../providers/email.provider.js';
import { generateInvoicePDF, InvoicePDFData } from '../providers/pdf.provider.js';
import { emitToUser } from '../socket/socketServer.js';
import { eventEmitter, HospitalEvents } from '../events/eventEmitter.js';

export const initWorkers = () => {
  const connection = getRedisClient();

  // 1. Email Worker
  const emailWorker = new Worker('EmailQueue', async (job: Job) => {
    logger.info({ jobId: job.id, name: job.name }, 'Processing email job...');
    const { to, subject, html, text } = job.data;
    await sendMail({ to, subject, html, text });
    
    // Emit notification event
    eventEmitter.emit(HospitalEvents.EMAIL_SENT, { to, subject, jobId: job.id });
  }, { connection: connection as any });
  
  emailWorker.on('error', (err) => {
    logger.debug(`BullMQ Worker EmailQueue error: ${err.message}`);
  });

  // 2. PDF Worker
  const pdfWorker = new Worker('PDFQueue', async (job: Job) => {
    logger.info({ jobId: job.id, name: job.name }, 'Processing PDF generation job...');
    const pdfData = job.data as InvoicePDFData;
    const filePath = await generateInvoicePDF(pdfData);
    
    eventEmitter.emit(HospitalEvents.BILL_PAID, { invoiceId: pdfData.invoiceId, filePath });
    return { filePath };
  }, { connection: connection as any });
  
  pdfWorker.on('error', (err) => {
    logger.debug(`BullMQ Worker PDFQueue error: ${err.message}`);
  });

  // 3. Notification Worker
  const notificationWorker = new Worker('NotificationQueue', async (job: Job) => {
    logger.info({ jobId: job.id, name: job.name }, 'Processing real-time notification job...');
    const { userId, title, message, type } = job.data;
    
    // Emit socket event to specific user
    emitToUser(userId, 'notification', { title, message, type, timestamp: new Date() });
    
    eventEmitter.emit(HospitalEvents.NOTIFICATION_CREATED, { userId, title });
  }, { connection: connection as any });
  
  notificationWorker.on('error', (err) => {
    logger.debug(`BullMQ Worker NotificationQueue error: ${err.message}`);
  });

  // 4. Lab OCR Worker
  const labOcrWorker = new Worker('LabOcrQueue', async (job: Job) => {
    logger.info({ jobId: job.id, name: job.name }, 'Processing lab report OCR job...');
    const { labReportId, pdfPath } = job.data;

    // Simulate OCR processing time
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const mockOcrResult = {
      bloodSugar: '110 mg/dL (Normal: < 140 mg/dL)',
      cholesterol: '240 mg/dL (High: > 200 mg/dL)',
      whiteBloodCells: '6.5 x10^3/uL (Normal: 4.5-11.0 x10^3/uL)',
      flaggedAnomalies: ['High Cholesterol']
    };

    logger.info({ labReportId, flaggedAnomaliesCount: mockOcrResult.flaggedAnomalies.length }, 'Lab report OCR finished');
    
    // Emit event that Lab Report OCR has finished
    eventEmitter.emit(HospitalEvents.LAB_REPORT_UPLOADED, { labReportId, ocrResult: mockOcrResult });
    
    return mockOcrResult;
  }, { connection: connection as any });
  
  labOcrWorker.on('error', (err) => {
    logger.debug(`BullMQ Worker LabOcrQueue error: ${err.message}`);
  });

  // 5. AI Agent Worker
  const aiWorker = new Worker('AIQueue', async (job: Job) => {
    logger.info({ jobId: job.id, name: job.name }, 'Processing AI agent task routing...');
    const { query, patientId, requestContext } = job.data;
    
    // We will hook this to the AI Agent framework shortly
    logger.info({ query, patientId }, 'AI Agent processing finished');
    eventEmitter.emit(HospitalEvents.AI_COMPLETED, { query, patientId, status: 'success' });
    
    return { status: 'success', response: 'AI processed query: ' + query };
  }, { connection: connection as any });
  
  aiWorker.on('error', (err) => {
    logger.debug(`BullMQ Worker AIQueue error: ${err.message}`);
  });

  logger.info('BullMQ workers initialized and actively listening');
};
