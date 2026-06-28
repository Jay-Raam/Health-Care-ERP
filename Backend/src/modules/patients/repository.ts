import { BaseRepository } from '../../shared/repositories/base.repository.js';
import { PatientModel, IPatientDocument } from './schema.js';

export class PatientRepository extends BaseRepository<IPatientDocument> {
  constructor() {
    super(PatientModel);
  }

  async findByUserId(userId: string): Promise<IPatientDocument | null> {
    return this.findOne({ user: userId });
  }

  // Optimize search with MongoDB aggregation instead of populate
  async searchPatients(queryText: string): Promise<any[]> {
    return this.model.aggregate([
      {
        $match: { deletedAt: null }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      {
        $unwind: '$userDetails'
      },
      {
        $match: {
          $or: [
            { 'userDetails.firstName': { $regex: queryText, $options: 'i' } },
            { 'userDetails.lastName': { $regex: queryText, $options: 'i' } },
            { 'userDetails.email': { $regex: queryText, $options: 'i' } },
            { phone: { $regex: queryText, $options: 'i' } }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          dateOfBirth: 1,
          gender: 1,
          phone: 1,
          address: 1,
          bloodType: 1,
          allergies: 1,
          medicalHistory: 1,
          emergencyContact: 1,
          user: {
            id: '$userDetails._id',
            email: '$userDetails.email',
            firstName: '$userDetails.firstName',
            lastName: '$userDetails.lastName',
            role: '$userDetails.role'
          }
        }
      }
    ]);
  }
}

export const patientRepository = new PatientRepository();
