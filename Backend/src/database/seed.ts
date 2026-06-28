import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { UserModel } from '../modules/auth/schema.js';
import { DoctorModel } from '../modules/doctors/schema.js';
import { PatientModel } from '../modules/patients/schema.js';
import { UserRole } from '../modules/auth/types.js';
import { logger } from '../shared/logs/logger.js';

const PASSWORD_HASH = 'Password123!';

export const seedDatabase = async (): Promise<void> => {
  try {
    logger.info('Checking if database needs seeding...');

    // Ensure default developer/admin accounts are verified and passwords are correct
    const startDocUser = await UserModel.findOne({ email: 'doctor@hospitalagent.ai' });
    if (startDocUser) {
      startDocUser.passwordHash = PASSWORD_HASH;
      startDocUser.isVerified = true;
      await startDocUser.save();
    }
    const startPatUser = await UserModel.findOne({ email: 'jayasriraam27@gmail.com' });
    if (startPatUser) {
      startPatUser.passwordHash = PASSWORD_HASH;
      startPatUser.isVerified = true;
      await startPatUser.save();
    }
    const startNurse = await UserModel.findOne({ email: 'nurse@hospitalagent.ai' });
    if (startNurse) {
      startNurse.passwordHash = PASSWORD_HASH;
      startNurse.isVerified = true;
      await startNurse.save();
    }

    // 1. Seed Doctors
    const doctorCount = await DoctorModel.countDocuments();
    if (doctorCount === 0) {
      logger.info('Seeding doctors...');

      // Ensure the default doctor user exists and has a profile
      let defaultDocUser = await UserModel.findOne({ email: 'doctor@hospitalagent.ai' });
      if (!defaultDocUser) {
        defaultDocUser = await UserModel.create({
          _id: new mongoose.Types.ObjectId('6a40ab9135fbd13400cd61df'),
          email: 'doctor@hospitalagent.ai',
          passwordHash: PASSWORD_HASH,
          firstName: 'Doctor',
          lastName: 'Strange',
          role: UserRole.DOCTOR,
          permissions: ['read:patients', 'write:clinical_notes', 'read:appointments', 'write:prescriptions'],
          isVerified: true
        });
      }

      await DoctorModel.create({
        user: defaultDocUser._id,
        specialty: 'Neurology',
        licenseNumber: 'LIC-999999',
        consultationFee: 150,
        biography: 'Chief neurosurgeon with 15+ years experience.',
        availability: [
          { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '17:00' },
          { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '17:00' }
        ],
        rating: 4.9,
        isAvailableToday: true
      });

      // Seed 20 more doctors
      const doctorNames = [
        { first: 'Sarah', last: 'Connor', spec: 'Cardiology' },
        { first: 'Helen', last: 'Cho', spec: 'Lab & Diagnostics' },
        { first: 'Robert', last: 'Carter', spec: 'Emergency Medicine' },
        { first: 'Gregory', last: 'House', spec: 'Diagnostics' },
        { first: 'James', last: 'Wilson', spec: 'Oncology' },
        { first: 'Allison', last: 'Cameron', spec: 'Immunology' },
        { first: 'Eric', last: 'Foreman', spec: 'Neurology' },
        { first: 'Robert', last: 'Chase', spec: 'Cardiology' },
        { first: 'Chris', last: 'Taub', spec: 'Plastic Surgery' },
        { first: 'Remy', last: 'Hadley', spec: 'Internal Medicine' },
        { first: 'Lawrence', last: 'Kutner', spec: 'Sports Medicine' },
        { first: 'Martha', last: 'Masters', spec: 'Pediatrics' },
        { first: 'Chi', last: 'Park', spec: 'Neurology' },
        { first: 'Jessica', last: 'Adams', spec: 'Pediatrics' },
        { first: 'Stephen', last: 'Strange', spec: 'Neurosurgeon' },
        { first: 'Leonard', last: 'McCoy', spec: 'Emergency Medicine' },
        { first: 'Beverly', last: 'Crusher', spec: 'Oncology' },
        { first: 'Julian', last: 'Bashir', spec: 'Genetics' },
        { first: 'John', last: 'Watson', spec: 'Internal Medicine' },
        { first: 'Dana', last: 'Scully', spec: 'Forensics' }
      ];

      for (let i = 0; i < doctorNames.length; i++) {
        const d = doctorNames[i];
        const email = `${d.first.toLowerCase()}.${d.last.toLowerCase()}@hospital.com`;
        
        let user = await UserModel.findOne({ email });
        if (!user) {
          user = await UserModel.create({
            email,
            passwordHash: PASSWORD_HASH,
            firstName: d.first,
            lastName: d.last,
            role: UserRole.DOCTOR,
            permissions: ['read:patients', 'write:clinical_notes', 'read:appointments', 'write:prescriptions'],
            isVerified: true
          });
        }

        await DoctorModel.create({
          user: user._id,
          specialty: d.spec,
          licenseNumber: `LIC-${Math.floor(100000 + Math.random() * 900000)}`,
          consultationFee: Math.floor(60 + Math.random() * 140),
          biography: `Specialist in ${d.spec} at the Main Medical Center.`,
          availability: [
            { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '17:00' },
            { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '17:00' }
          ],
          rating: parseFloat((4.5 + Math.random() * 0.5).toFixed(2)),
          isAvailableToday: true
        });
      }
      logger.info('Doctors seeded successfully.');
    }

    // 2. Seed Nurses (10 users with RECEPTIONIST role and Nurse titles)
    const nurseEmails = Array.from({ length: 10 }, (_, i) => `nurse${i + 1}@hospitalagent.ai`);
    let addedNurses = 0;
    
    // Ensure default nurse exists and is verified
    let defaultNurse = await UserModel.findOne({ email: 'nurse@hospitalagent.ai' });
    if (!defaultNurse) {
      await UserModel.create({
        _id: new mongoose.Types.ObjectId('6a40aa1e35fbd13400cd61d6'),
        email: 'nurse@hospitalagent.ai',
        passwordHash: PASSWORD_HASH,
        firstName: 'Nurse',
        lastName: 'Nancy',
        role: UserRole.RECEPTIONIST,
        permissions: ['read:patients', 'write:patients', 'manage:appointments', 'read:billing'],
        isVerified: true
      });
    } else if (!defaultNurse.isVerified) {
      defaultNurse.isVerified = true;
      await defaultNurse.save();
    }

    for (let i = 0; i < nurseEmails.length; i++) {
      const email = nurseEmails[i];
      const existing = await UserModel.findOne({ email });
      if (!existing) {
        const names = ['Nancy', 'Joy', 'Ratched', 'Chapel', 'Jackie', 'Carla', 'Abby', 'Carol', 'Elena', 'Lucy'];
        await UserModel.create({
          email,
          passwordHash: PASSWORD_HASH,
          firstName: 'Nurse',
          lastName: names[i] || `Nurse${i + 1}`,
          role: UserRole.RECEPTIONIST,
          permissions: ['read:patients', 'write:patients', 'manage:appointments', 'read:billing'],
          isVerified: true
        });
        addedNurses++;
      }
    }
    if (addedNurses > 0) {
      logger.info(`Seeded ${addedNurses} nurse accounts.`);
    }

    // 3. Seed Receptionists (8 users with RECEPTIONIST role)
    const recepEmails = Array.from({ length: 8 }, (_, i) => `receptionist${i + 1}@hospitalagent.ai`);
    let addedReceps = 0;
    for (let i = 0; i < recepEmails.length; i++) {
      const email = recepEmails[i];
      const existing = await UserModel.findOne({ email });
      if (!existing) {
        const lastNames = ['Smith', 'Jones', 'Taylor', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Thomas'];
        await UserModel.create({
          email,
          passwordHash: PASSWORD_HASH,
          firstName: 'Receptionist',
          lastName: lastNames[i] || `Recep${i + 1}`,
          role: UserRole.RECEPTIONIST,
          permissions: ['read:patients', 'write:patients', 'manage:appointments', 'read:billing'],
          isVerified: true
        });
        addedReceps++;
      }
    }
    if (addedReceps > 0) {
      logger.info(`Seeded ${addedReceps} receptionist accounts.`);
    }

    // 4. Seed Patients
    const patientCount = await PatientModel.countDocuments();
    if (patientCount === 0) {
      logger.info('Seeding patients...');

      // Ensure the default patient user exists and has a profile
      let defaultPatUser = await UserModel.findOne({ email: 'jayasriraam27@gmail.com' });
      if (!defaultPatUser) {
        defaultPatUser = await UserModel.create({
          _id: new mongoose.Types.ObjectId('6a40963e44d3863c4110d78b'),
          email: 'jayasriraam27@gmail.com',
          passwordHash: PASSWORD_HASH,
          firstName: 'Jayasriraam',
          lastName: 'Sri',
          role: UserRole.PATIENT,
          permissions: ['read:own_profile', 'read:own_appointments', 'read:own_medical_records'],
          isVerified: true
        });
      }

      await PatientModel.create({
        user: defaultPatUser._id,
        dateOfBirth: new Date('1990-06-15'),
        gender: 'MALE',
        phone: '+1 (555) 012-3456',
        address: '123 Main St, New York, NY 10001',
        bloodType: 'O+',
        allergies: ['Penicillin'],
        medicalHistory: ['Hypertension']
      });

      // Seed a few other patients
      const patientNames = [
        { first: 'Alexander', last: 'Sterling', dob: '1985-04-20', gender: 'MALE', blood: 'A+' },
        { first: 'Evelyn', last: 'Montgomery', dob: '1992-09-12', gender: 'FEMALE', blood: 'B-' },
        { first: 'Marcus', last: 'Vance', dob: '1978-11-30', gender: 'MALE', blood: 'O-' }
      ];

      for (const p of patientNames) {
        const email = `${p.first.toLowerCase()}.${p.last.toLowerCase()}@hospital.com`;
        
        let user = await UserModel.findOne({ email });
        if (!user) {
          user = await UserModel.create({
            email,
            passwordHash: PASSWORD_HASH,
            firstName: p.first,
            lastName: p.last,
            role: UserRole.PATIENT,
            permissions: ['read:own_profile', 'read:own_appointments', 'read:own_medical_records'],
            isVerified: true
          });
        }

        await PatientModel.create({
          user: user._id,
          dateOfBirth: new Date(p.dob),
          gender: p.gender as any,
          phone: `+1 (555) 014-${Math.floor(1000 + Math.random() * 9000)}`,
          address: `456 Elm St, Suite ${Math.floor(10 + Math.random() * 90)}, Metropolis`,
          bloodType: p.blood,
          allergies: [],
          medicalHistory: []
        });
      }
      logger.info('Patients seeded successfully.');
    }

    logger.info('Database check/seeding complete.');
  } catch (error) {
    logger.error(error, 'Error during database seeding');
  }
};
