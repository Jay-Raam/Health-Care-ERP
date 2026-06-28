import { billRepository } from './repository.js';
import { IBillDocument } from './schema.js';
import { BillStatus, IBillItem } from './types.js';
import { NotFoundError } from '../../shared/errors/AppError.js';
import { pdfQueue, emailQueue } from '../../shared/queue/bullmq.js';
import { eventEmitter, HospitalEvents } from '../../shared/events/eventEmitter.js';
import { emitToUser } from '../../shared/socket/socketServer.js';
import { templates } from '../../shared/providers/email.provider.js';

export class BillService {
  async createBill(data: {
    patientId: string;
    appointmentId?: string;
    items: IBillItem[];
  }): Promise<IBillDocument> {
    // 1. Calculate Grand Total
    const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    // 2. Save Bill Record
    const bill = await billRepository.create({
      patient: data.patientId,
      appointment: data.appointmentId,
      items: data.items,
      totalAmount,
      status: BillStatus.PENDING
    } as any);

    // 3. Queue Invoice PDF Generation on BullMQ
    // (We also retrieve Patient email from User details in a production system. Stubbing email for now.)
    await pdfQueue.add('GenerateInvoicePDF', {
      invoiceId: bill._id.toString(),
      patientName: 'Patient Record',
      patientEmail: 'patient@hospitalagent.ai',
      date: new Date().toLocaleDateString(),
      items: data.items,
      totalAmount
    });

    return bill;
  }

  async payBill(billId: string): Promise<IBillDocument> {
    const bill = await billRepository.findById(billId);
    if (!bill) {
      throw new NotFoundError('Invoice not found');
    }

    const updated = await billRepository.update(billId, {
      $set: { status: BillStatus.PAID }
    });

    if (!updated) {
      throw new NotFoundError('Failed to process payment');
    }

    // Trigger Success Events
    eventEmitter.emit(HospitalEvents.BILL_PAID, updated);

    // Send Real-time notification
    emitToUser(updated.patient.toString(), 'billing_paid', {
      invoiceId: updated._id,
      status: updated.status,
      amount: updated.totalAmount
    });

    // Queue email confirmation
    await emailQueue.add('SendPaymentReceiptEmail', {
      to: 'patient@hospitalagent.ai',
      subject: 'Payment Confirmation - AI Hospital',
      html: templates.invoice('Patient', updated.totalAmount, updated._id.toString())
    });

    return updated;
  }

  async listPatientBills(patientId: string): Promise<IBillDocument[]> {
    return billRepository.findByPatient(patientId);
  }
}

export const billService = new BillService();
export default billService;
