import { EventEmitter } from 'events';
import { logger } from '../logs/logger.js';

export enum HospitalEvents {
  PATIENT_REGISTERED = 'patient.registered',
  APPOINTMENT_CREATED = 'appointment.created',
  APPOINTMENT_UPDATED = 'appointment.updated',
  BILL_PAID = 'bill.paid',
  LAB_REPORT_UPLOADED = 'lab.uploaded',
  EMAIL_SENT = 'email.sent',
  NOTIFICATION_CREATED = 'notification.created',
  AI_COMPLETED = 'ai.completed'
}

class TypedEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20);
  }

  // Override emit to add debug logging
  override emit(event: string | symbol, ...args: any[]): boolean {
    logger.debug({ event, payload: args[0] }, `System event emitted: ${String(event)}`);
    return super.emit(event, ...args);
  }
}

export const eventEmitter = new TypedEventEmitter();
export default eventEmitter;
