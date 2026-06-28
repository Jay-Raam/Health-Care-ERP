import { connectDatabase, disconnectDatabase } from './database/connection.js';
import { DoctorModel } from './modules/doctors/schema.js';
import { UserModel } from './modules/auth/schema.js';

async function check() {
  await connectDatabase();
  try {
    const totalUsers = await UserModel.countDocuments({});
    const docUsers = await UserModel.countDocuments({ role: 'DOCTOR' });
    const docs = await DoctorModel.countDocuments({});

    console.log('--- STATS ---');
    console.log('Total Users:', totalUsers);
    console.log('Doctor Users:', docUsers);
    console.log('Doctor Profiles (DoctorModel):', docs);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await disconnectDatabase();
    process.exit(0);
  }
}

check();
