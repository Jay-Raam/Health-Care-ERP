import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { logger } from '../logs/logger.js';

export interface InvoicePDFData {
  invoiceId: string;
  patientName: string;
  patientEmail: string;
  date: string;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
  totalAmount: number;
}

export const generateInvoicePDF = async (data: InvoicePDFData): Promise<string> => {
  const dirPath = path.resolve('storage', 'invoices');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, `invoice_${data.invoiceId}.pdf`);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // Header Banner
      doc
        .fillColor('#2c3e50')
        .fontSize(20)
        .text('AI HOSPITAL CENTER', { align: 'center' });
      doc
        .fontSize(10)
        .fillColor('#7f8c8d')
        .text('100 Health Sciences Way, Medical District', { align: 'center' })
        .text('Tel: (555) 019-9000 | billing@hospitalagent.ai', { align: 'center' });

      doc.moveDown(2);

      // Invoice metadata
      doc
        .fillColor('#2c3e50')
        .fontSize(16)
        .text('INVOICE', { underline: true });
      doc.moveDown(0.5);

      doc
        .fontSize(10)
        .fillColor('#333333')
        .text(`Invoice ID: ${data.invoiceId}`)
        .text(`Date: ${data.date}`)
        .text(`Patient Name: ${data.patientName}`)
        .text(`Email: ${data.patientEmail}`);

      doc.moveDown(1.5);

      // Items Table Header
      const tableTop = 230;
      doc.font('Helvetica-Bold');
      doc.text('Description', 50, tableTop);
      doc.text('Qty', 300, tableTop, { width: 50, align: 'right' });
      doc.text('Unit Price', 380, tableTop, { width: 80, align: 'right' });
      doc.text('Total', 480, tableTop, { width: 80, align: 'right' });

      doc.moveTo(50, tableTop + 15).lineTo(560, tableTop + 15).stroke();

      // Items Rows
      doc.font('Helvetica');
      let currentY = tableTop + 25;
      data.items.forEach((item) => {
        const itemTotal = item.quantity * item.unitPrice;
        doc.text(item.description, 50, currentY);
        doc.text(String(item.quantity), 300, currentY, { width: 50, align: 'right' });
        doc.text(`$${item.unitPrice.toFixed(2)}`, 380, currentY, { width: 80, align: 'right' });
        doc.text(`$${itemTotal.toFixed(2)}`, 480, currentY, { width: 80, align: 'right' });
        currentY += 20;
      });

      doc.moveTo(50, currentY + 5).lineTo(560, currentY + 5).stroke();
      currentY += 15;

      // Total Due
      doc.font('Helvetica-Bold');
      doc.text('Grand Total:', 380, currentY, { width: 80, align: 'right' });
      doc.text(`$${data.totalAmount.toFixed(2)}`, 480, currentY, { width: 80, align: 'right' });

      doc.moveDown(3);
      doc
        .font('Helvetica-Oblique')
        .fontSize(9)
        .fillColor('#7f8c8d')
        .text('Thank you for choosing AI Hospital Center. For questions, please reach out to our billing team.', { align: 'center' });

      doc.end();

      writeStream.on('finish', () => {
        logger.info(`Invoice PDF generated successfully at ${filePath}`);
        resolve(filePath);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};
