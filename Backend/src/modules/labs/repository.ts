import { BaseRepository } from '../../shared/repositories/base.repository.js';
import { LabReportModel, ILabReportDocument } from './schema.js';

export class LabReportRepository extends BaseRepository<ILabReportDocument> {
  constructor() {
    super(LabReportModel);
  }

  async findByPatient(patientId: string): Promise<ILabReportDocument[]> {
    return this.find({ patient: patientId });
  }
}

export const labReportRepository = new LabReportRepository();
