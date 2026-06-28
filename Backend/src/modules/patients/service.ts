import { patientRepository } from './repository.js';
import { IPatientDocument } from './schema.js';
import { NotFoundError } from '../../shared/errors/AppError.js';

export class PatientService {
  async createProfile(userId: string, data: any): Promise<IPatientDocument> {
    const existing = await patientRepository.findByUserId(userId);
    if (existing) {
      return this.updateProfile(existing._id.toString(), data);
    }
    return patientRepository.create({ ...data, user: userId });
  }

  async updateProfile(patientId: string, updateData: any): Promise<IPatientDocument> {
    const patient = await patientRepository.findById(patientId);
    if (!patient) {
      throw new NotFoundError('Patient profile not found');
    }
    const updated = await patientRepository.update(patientId, updateData);
    if (!updated) {
      throw new NotFoundError('Failed to update patient profile');
    }
    return updated;
  }

  async getProfile(patientId: string): Promise<IPatientDocument> {
    const patient = await patientRepository.findById(patientId);
    if (!patient) {
      throw new NotFoundError('Patient profile not found');
    }
    return patient;
  }

  async getProfileByUserId(userId: string): Promise<IPatientDocument> {
    const patient = await patientRepository.findByUserId(userId);
    if (!patient) {
      throw new NotFoundError('Patient profile not found for this user');
    }
    return patient;
  }

  async search(term: string): Promise<any[]> {
    return patientRepository.searchPatients(term);
  }
}

export const patientService = new PatientService();
