import DataLoader from 'dataloader';
import { UserModel } from '../../modules/auth/schema.js';
import { PatientModel } from '../../modules/patients/schema.js';
import { DoctorModel } from '../../modules/doctors/schema.js';
import { AppointmentModel } from '../../modules/appointments/schema.js';

export interface IDataLoaders {
  user: DataLoader<string, any>;
  patient: DataLoader<string, any>;
  doctor: DataLoader<string, any>;
  appointment: DataLoader<string, any>;
}

export const createDataLoaders = (): IDataLoaders => {
  return {
    user: new DataLoader<string, any>(async (keys) => {
      const users = await UserModel.find({ _id: { $in: keys }, deletedAt: null }).lean().exec();
      const userMap = new Map(users.map((u) => [u._id.toString(), u]));
      return keys.map((key) => userMap.get(key.toString()) || null);
    }),

    patient: new DataLoader<string, any>(async (keys) => {
      const patients = await PatientModel.find({ _id: { $in: keys }, deletedAt: null }).lean().exec();
      const patientMap = new Map(patients.map((p) => [p._id.toString(), p]));
      return keys.map((key) => patientMap.get(key.toString()) || null);
    }),

    doctor: new DataLoader<string, any>(async (keys) => {
      const doctors = await DoctorModel.find({ _id: { $in: keys }, deletedAt: null }).lean().exec();
      const doctorMap = new Map(doctors.map((d) => [d._id.toString(), d]));
      return keys.map((key) => doctorMap.get(key.toString()) || null);
    }),

    appointment: new DataLoader<string, any>(async (keys) => {
      const appointments = await AppointmentModel.find({ _id: { $in: keys }, deletedAt: null }).lean().exec();
      const appointmentMap = new Map(appointments.map((a) => [a._id.toString(), a]));
      return keys.map((key) => appointmentMap.get(key.toString()) || null);
    })
  };
};
