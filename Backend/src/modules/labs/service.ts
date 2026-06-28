import { labReportRepository } from './repository.js';
import { ILabReportDocument } from './schema.js';
import { LabReportStatus } from './types.js';
import { NotFoundError } from '../../shared/errors/AppError.js';
import { labOcrQueue, notificationQueue } from '../../shared/queue/bullmq.js';
import { eventEmitter, HospitalEvents } from '../../shared/events/eventEmitter.js';

export class LabReportService {
  constructor() {
    this.registerEventListeners();
  }

  // Register asynchronous listener for OCR completions
  private registerEventListeners() {
    eventEmitter.on(HospitalEvents.LAB_REPORT_UPLOADED, async (payload: { labReportId: string; ocrResult: any }) => {
      try {
        await this.updateOcrResult(payload.labReportId, payload.ocrResult);
      } catch (err: any) {
        console.error('Failed to update lab report OCR results: ', err.message);
      }
    });
  }

  async createReport(data: {
    patientId: string;
    doctorId?: string;
    testName: string;
    fileUrl: string;
  }): Promise<ILabReportDocument> {
    const report = await labReportRepository.create({
      patient: data.patientId,
      doctor: data.doctorId,
      testName: data.testName,
      fileUrl: data.fileUrl,
      status: LabReportStatus.PENDING
    } as any);

    // Queue OCR task
    await labOcrQueue.add('ProcessLabOcr', {
      labReportId: report._id.toString(),
      pdfPath: data.fileUrl
    });

    return report;
  }

  async updateOcrResult(reportId: string, ocrResult: any): Promise<ILabReportDocument> {
    const report = await labReportRepository.findById(reportId);
    if (!report) {
      throw new NotFoundError('Lab report not found');
    }

    const summary = `Parsed anomalies: ${ocrResult.flaggedAnomalies.join(', ') || 'None'}`;

    const updated = await labReportRepository.update(reportId, {
      $set: {
        status: LabReportStatus.COMPLETED,
        ocrResult,
        resultSummary: summary
      }
    });

    if (!updated) {
      throw new NotFoundError('Failed to update report with OCR data');
    }

    // Queue real-time notification to user
    await notificationQueue.add('SendRealtimeNotification', {
      userId: updated.patient.toString(),
      title: 'Lab Report Ready',
      message: `Your lab results for ${updated.testName} are now ready. Summary: ${summary}`,
      type: 'LAB_REPORT'
    });

    return updated;
  }

  async getPatientReports(patientId: string): Promise<ILabReportDocument[]> {
    return labReportRepository.findByPatient(patientId);
  }
}

export const labReportService = new LabReportService();
export default labReportService;
