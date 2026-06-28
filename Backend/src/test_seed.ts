import { connectDatabase, disconnectDatabase } from './database/connection.js';
import { DoctorModel } from './modules/doctors/schema.js';
import { PatientModel } from './modules/patients/schema.js';
import { UserModel } from './modules/auth/schema.js';
import { seedDatabase } from './database/seed.js';

async function run() {
  await connectDatabase();
  try {
    console.log('Clearing Doctor, Patient, User collections...');
    await DoctorModel.deleteMany({});
    await PatientModel.deleteMany({});
    await UserModel.deleteMany({});

    console.log('Running seeder...');
    await seedDatabase();

    const users = await UserModel.find({});
    const doctors = await DoctorModel.find({});
    console.log('Seeding finished!');
    console.log('Total Users:', users.length);
    console.log('Total Doctors:', doctors.length);
  } catch (err) {
    console.error('Error during test seed:', err);
  } finally {
    await disconnectDatabase();
    process.exit(0);
  }
}

run();
