import { BaseRepository } from '../../shared/repositories/base.repository.js';
import { DoctorModel, IDoctorDocument } from './schema.js';

export class DoctorRepository extends BaseRepository<IDoctorDocument> {
  constructor() {
    super(DoctorModel);
  }

  async findByUserId(userId: string): Promise<IDoctorDocument | null> {
    return this.findOne({ user: userId });
  }

  async findActiveDoctors(): Promise<any[]> {
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
        $project: {
          _id: 1,
          specialty: 1,
          licenseNumber: 1,
          consultationFee: 1,
          biography: 1,
          availability: 1,
          rating: 1,
          isAvailableToday: 1,
          user: {
            id: '$userDetails._id',
            email: '$userDetails.email',
            firstName: '$userDetails.firstName',
            lastName: '$userDetails.lastName'
          }
        }
      }
    ]);
  }
}

export const doctorRepository = new DoctorRepository();
