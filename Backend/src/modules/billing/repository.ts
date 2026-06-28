import { BaseRepository } from '../../shared/repositories/base.repository.js';
import { BillModel, IBillDocument } from './schema.js';

export class BillRepository extends BaseRepository<IBillDocument> {
  constructor() {
    super(BillModel);
  }

  async findByPatient(patientId: string): Promise<IBillDocument[]> {
    return this.find({ patient: patientId });
  }

  async findPendingBills(): Promise<IBillDocument[]> {
    return this.find({ status: 'PENDING' });
  }
}

export const billRepository = new BillRepository();
