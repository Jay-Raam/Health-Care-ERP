import request from 'supertest';
import { createApp } from '../server.js';

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn().mockImplementation((token) => {
    if (token === 'expired') {
      throw new Error('Expired token');
    }
    return {
      id: '507f1f77bcf86cd799439011',
      email: 'doctor@hospitalagent.ai',
      role: 'SUPER_ADMIN',
      permissions: ['*']
    };
  }),
  sign: jest.fn().mockReturnValue('mock-token-string')
}));

// Mock bcrypt comparison
jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed_password')
}));

// Mock Redis
jest.mock('../shared/cache/redis', () => ({
  checkRedisStatus: () => true,
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(true),
  cacheInvalidatePattern: jest.fn().mockResolvedValue(true),
  getRedisClient: () => ({
    call: jest.fn().mockResolvedValue('OK')
  }),
  initRedis: () => ({
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue({})
  })
}));

// Mock BullMQ
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    client: Promise.resolve({}),
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' })
  })),
  Worker: jest.fn()
}));

// Intercept Mongoose model calls with stateful and robust mock hooks
jest.mock('../modules/auth/schema.js', () => {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'doctor@hospitalagent.ai',
    passwordHash: 'hashed_password',
    firstName: 'John',
    lastName: 'Doe',
    role: 'SUPER_ADMIN',
    permissions: ['*'],
    isVerified: true,
    refreshTokens: [{ token: 'valid-refresh-token' }],
    comparePassword: () => true,
    save: jest.fn().mockResolvedValue(true)
  };

  const mockFindById = jest.fn().mockResolvedValue(mockUser);
  
  // Stateful call counter for new registrations
  let aliceCallCount = 0;
  
  const mockFindOne = jest.fn().mockImplementation((query) => {
    if (query && query.email === 'doctor@hospitalagent.ai') {
      return Promise.resolve(mockUser);
    }
    if (query && query.email === 'alice@example.com') {
      aliceCallCount++;
      if (aliceCallCount === 1) {
        // First call: Conflict check, returns null
        return Promise.resolve(null);
      }
      // Subsequent calls: OTP delivery lookup, returns user
      return Promise.resolve({ ...mockUser, email: 'alice@example.com' });
    }
    return Promise.resolve(null);
  });

  const mockCreate = jest.fn().mockImplementation((arg) => {
    const doc = Array.isArray(arg) ? arg[0] : arg;
    return Promise.resolve([{
      _id: '507f1f77bcf86cd799439011',
      ...doc
    }]);
  });

  const mockFindOneAndUpdate = jest.fn().mockImplementation((query, update) => Promise.resolve({
    ...mockUser,
    ...(update?.$set || {})
  }));
  
  const mockModel: any = jest.fn().mockImplementation(() => mockUser);
  mockModel.findById = mockFindById;
  mockModel.findOne = mockFindOne;
  mockModel.create = mockCreate;
  mockModel.findOneAndUpdate = mockFindOneAndUpdate;
  mockModel.find = jest.fn().mockResolvedValue([mockUser]);

  return {
    UserModel: mockModel,
    default: mockModel
  };
});

jest.mock('../modules/patients/schema.js', () => {
  const mockPatient = {
    _id: '507f1f77bcf86cd799439012',
    user: '507f1f77bcf86cd799439011',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'MALE',
    phone: '1234567890',
    address: '123 Main St',
    bloodType: 'O+',
    save: jest.fn().mockResolvedValue(true)
  };

  const mockModel: any = jest.fn();
  mockModel.findById = jest.fn().mockResolvedValue(mockPatient);
  mockModel.findOne = jest.fn().mockResolvedValue(mockPatient);
  mockModel.create = jest.fn().mockImplementation((arg) => {
    const doc = Array.isArray(arg) ? arg[0] : arg;
    return Promise.resolve([{
      _id: '507f1f77bcf86cd799439012',
      ...doc
    }]);
  });
  mockModel.findOneAndUpdate = jest.fn().mockImplementation((query, update) => Promise.resolve({
    ...mockPatient,
    ...(update?.$set || {})
  }));
  mockModel.find = jest.fn().mockResolvedValue([mockPatient]);
  mockModel.aggregate = jest.fn().mockResolvedValue([mockPatient]);
  return { PatientModel: mockModel, default: mockModel };
});

jest.mock('../modules/doctors/schema.js', () => {
  const mockDoctor = {
    _id: '507f1f77bcf86cd799439013',
    user: '507f1f77bcf86cd799439011',
    specialty: 'Cardiology',
    licenseNumber: 'DOC12345',
    consultationFee: 150.0,
    availability: [{ dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00' }],
    save: jest.fn().mockResolvedValue(true)
  };

  const mockModel: any = jest.fn();
  mockModel.findById = jest.fn().mockResolvedValue(mockDoctor);
  mockModel.findOne = jest.fn().mockResolvedValue(mockDoctor);
  mockModel.create = jest.fn().mockImplementation((arg) => {
    const doc = Array.isArray(arg) ? arg[0] : arg;
    return Promise.resolve([{
      _id: '507f1f77bcf86cd799439013',
      ...doc
    }]);
  });
  mockModel.findOneAndUpdate = jest.fn().mockImplementation((query, update) => Promise.resolve({
    ...mockDoctor,
    ...(update?.$set || {})
  }));
  mockModel.find = jest.fn().mockResolvedValue([mockDoctor]);
  mockModel.aggregate = jest.fn().mockResolvedValue([mockDoctor]);
  return { DoctorModel: mockModel, default: mockModel };
});

jest.mock('../modules/appointments/schema.js', () => {
  const mockAppointment = {
    _id: '507f1f77bcf86cd799439014',
    patient: '507f1f77bcf86cd799439012',
    doctor: '507f1f77bcf86cd799439013',
    appointmentDate: new Date(),
    startTime: '10:00',
    endTime: '10:30',
    status: 'PENDING',
    reason: 'Checkup',
    save: jest.fn().mockResolvedValue(true)
  };

  const mockModel: any = jest.fn();
  mockModel.findById = jest.fn().mockResolvedValue(mockAppointment);
  mockModel.findOne = jest.fn().mockResolvedValue(mockAppointment);
  mockModel.create = jest.fn().mockImplementation((arg) => {
    const doc = Array.isArray(arg) ? arg[0] : arg;
    return Promise.resolve([{
      _id: '507f1f77bcf86cd799439014',
      ...doc
    }]);
  });
  mockModel.findOneAndUpdate = jest.fn().mockImplementation((query, update) => Promise.resolve({
    ...mockAppointment,
    ...(update?.$set || {})
  }));

  // Route searches: return [] for conflict checks and [mockAppointment] for listings
  mockModel.find = jest.fn().mockImplementation((query) => {
    if (query && query.doctor && query.appointmentDate) {
      return Promise.resolve([]);
    }
    return Promise.resolve([mockAppointment]);
  });

  mockModel.countDocuments = jest.fn().mockResolvedValue(5);
  return { AppointmentModel: mockModel, default: mockModel };
});

jest.mock('../modules/billing/schema.js', () => {
  const mockBill = {
    _id: '507f1f77bcf86cd799439015',
    patient: '507f1f77bcf86cd799439012',
    items: [{ description: 'Consultation', quantity: 1, unitPrice: 150 }],
    totalAmount: 150.0,
    status: 'PENDING',
    save: jest.fn().mockResolvedValue(true)
  };

  const mockModel: any = jest.fn();
  mockModel.findById = jest.fn().mockResolvedValue(mockBill);
  mockModel.findOne = jest.fn().mockResolvedValue(mockBill);
  mockModel.create = jest.fn().mockImplementation((arg) => {
    const doc = Array.isArray(arg) ? arg[0] : arg;
    return Promise.resolve([{
      _id: '507f1f77bcf86cd799439015',
      ...doc
    }]);
  });
  mockModel.findOneAndUpdate = jest.fn().mockImplementation((query, update) => Promise.resolve({
    ...mockBill,
    ...(update?.$set || {})
  }));
  mockModel.find = jest.fn().mockResolvedValue([mockBill]);
  return { BillModel: mockModel, default: mockModel };
});

jest.mock('../modules/labs/schema.js', () => {
  const mockLab = {
    _id: '507f1f77bcf86cd799439016',
    patient: '507f1f77bcf86cd799439012',
    testName: 'Blood Sugar',
    fileUrl: 'http://example.com/report.pdf',
    status: 'PENDING',
    save: jest.fn().mockResolvedValue(true)
  };

  const mockModel: any = jest.fn();
  mockModel.findById = jest.fn().mockResolvedValue(mockLab);
  mockModel.findOne = jest.fn().mockResolvedValue(mockLab);
  mockModel.create = jest.fn().mockImplementation((arg) => {
    const doc = Array.isArray(arg) ? arg[0] : arg;
    return Promise.resolve([{
      _id: '507f1f77bcf86cd799439016',
      ...doc
    }]);
  });
  mockModel.findOneAndUpdate = jest.fn().mockImplementation((query, update) => Promise.resolve({
    ...mockLab,
    ...(update?.$set || {})
  }));
  mockModel.find = jest.fn().mockResolvedValue([mockLab]);
  return { LabReportModel: mockModel, default: mockModel };
});

describe('GraphQL Yoga API Integration Tests', () => {
  let app: any;

  beforeAll(() => {
    app = createApp();
  });

  const sendQuery = async (query: string, variables: any = {}, token = 'valid-token') => {
    const req = request(app)
      .post('/graphql')
      .set('Content-Type', 'application/json');
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    const res = await req.send({ query, variables });
    return res;
  };

  describe('1. Authentication GraphQL APIs', () => {
    it('register mutation', async () => {
      const q = `
        mutation($input: RegisterInput!) {
          register(input: $input) {
            success
            message
          }
        }
      `;
      const res = await sendQuery(q, {
        input: {
          firstName: 'Alice',
          lastName: 'Smith',
          email: 'alice@example.com',
          password: 'Password123!',
          role: 'PATIENT'
        }
      });
      expect(res.body.data.register.success).toBe(true);
    });

    it('login mutation', async () => {
      const q = `
        mutation($input: LoginInput!) {
          login(input: $input) {
            success
            message
            data {
              accessToken
            }
          }
        }
      `;
      const res = await sendQuery(q, {
        input: {
          email: 'doctor@hospitalagent.ai',
          password: 'Password123!'
        }
      });
      expect(res.body.data.login.success).toBe(true);
    });

    it('verifyOtp mutation', async () => {
      const q = `
        mutation($input: VerifyOtpInput!) {
          verifyOtp(input: $input) {
            success
            message
          }
        }
      `;
      const res = await sendQuery(q, {
        input: {
          email: 'doctor@hospitalagent.ai',
          otp: '123456'
        }
      });
      expect(res.body.data.verifyOtp.success).toBe(true);
    });

    it('requestOtp mutation', async () => {
      const q = `
        mutation {
          requestOtp(email: "doctor@hospitalagent.ai") {
            success
            message
          }
        }
      `;
      const res = await sendQuery(q);
      expect(res.body.data.requestOtp.success).toBe(true);
    });

    it('resetPassword mutation', async () => {
      const q = `
        mutation($input: ResetPasswordInput!) {
          resetPassword(input: $input) {
            success
            message
          }
        }
      `;
      const res = await sendQuery(q, {
        input: {
          email: 'doctor@hospitalagent.ai',
          otp: '123456',
          newPassword: 'NewSecurePassword123!'
        }
      });
      expect(res.body.data.resetPassword.success).toBe(true);
    });
  });

  describe('2. Patient Profile GraphQL APIs', () => {
    it('createPatientProfile mutation', async () => {
      const q = `
        mutation($input: CreatePatientInput!) {
          createPatientProfile(input: $input) {
            phone
            address
            bloodType
          }
        }
      `;
      const res = await sendQuery(q, {
        input: {
          dateOfBirth: '1990-01-01',
          gender: 'MALE',
          phone: '1234567890',
          address: '123 Test St',
          bloodType: 'O+'
        }
      });
      expect(res.body.data.createPatientProfile).toHaveProperty('bloodType', 'O+');
    });

    it('myPatientProfile query', async () => {
      const q = `
        query {
          myPatientProfile {
            phone
            address
          }
        }
      `;
      const res = await sendQuery(q);
      expect(res.body.data.myPatientProfile).toHaveProperty('phone', '1234567890');
    });
  });

  describe('3. Doctor GraphQL APIs', () => {
    it('createDoctorProfile mutation', async () => {
      const q = `
        mutation($input: CreateDoctorInput!) {
          createDoctorProfile(input: $input) {
            specialty
            licenseNumber
            consultationFee
          }
        }
      `;
      const res = await sendQuery(q, {
        input: {
          specialty: 'Cardiology',
          licenseNumber: 'DOC12345',
          consultationFee: 150.0
        }
      });
      expect(res.body.data.createDoctorProfile).toHaveProperty('specialty', 'Cardiology');
    });

    it('doctorsList query', async () => {
      const q = `
        query {
          doctorsList {
            specialty
            licenseNumber
          }
        }
      `;
      const res = await sendQuery(q);
      expect(res.body.data.doctorsList[0]).toHaveProperty('specialty', 'Cardiology');
    });
  });

  describe('4. Appointment Booking GraphQL APIs', () => {
    it('bookAppointment mutation', async () => {
      const q = `
        mutation($input: BookAppointmentInput!) {
          bookAppointment(input: $input) {
            reason
            startTime
            status
          }
        }
      `;
      const res = await sendQuery(q, {
        input: {
          doctorId: '507f1f77bcf86cd799439013',
          appointmentDate: '2026-06-27',
          startTime: '10:00',
          endTime: '10:30',
          reason: 'General Checkup'
        }
      });
      expect(res.body.data.bookAppointment).toHaveProperty('status', 'PENDING');
    });

    it('myAppointments query', async () => {
      const q = `
        query {
          myAppointments {
            reason
            status
          }
        }
      `;
      const res = await sendQuery(q);
      expect(res.body.data.myAppointments[0]).toHaveProperty('reason', 'Checkup');
    });
  });

  describe('5. Invoicing & Billing GraphQL APIs', () => {
    it('createBill mutation', async () => {
      const q = `
        mutation($input: CreateBillInput!) {
          createBill(input: $input) {
            totalAmount
            status
          }
        }
      `;
      const res = await sendQuery(q, {
        input: {
          patientId: '507f1f77bcf86cd799439012',
          items: [{ description: 'Cardiology Session', quantity: 1, unitPrice: 150.0 }]
        }
      });
      expect(res.body.data.createBill).toHaveProperty('totalAmount', 150);
    });

    it('payBill mutation', async () => {
      const q = `
        mutation {
          payBill(id: "507f1f77bcf86cd799439015") {
            status
            totalAmount
          }
        }
      `;
      const res = await sendQuery(q);
      expect(res.body.data.payBill).toHaveProperty('status', 'PAID');
    });
  });

  describe('6. Lab Report GraphQL APIs', () => {
    it('uploadLabReport mutation', async () => {
      const q = `
        mutation($input: UploadLabReportInput!) {
          uploadLabReport(input: $input) {
            testName
            status
            fileUrl
          }
        }
      `;
      const res = await sendQuery(q, {
        input: {
          patientId: '507f1f77bcf86cd799439012',
          testName: 'Thyroid TSH',
          fileUrl: 'http://example.com/tsh_report.pdf'
        }
      });
      expect(res.body.data.uploadLabReport).toHaveProperty('status', 'PENDING');
    });
  });

  describe('7. AI Planner Agent Mutation API', () => {
    it('askHospitalAgent executes AI route and responses', async () => {
      const q = `
        mutation {
          askHospitalAgent(query: "Please explain my cholesterol levels and doctor recommendations") {
            success
            message
            data {
              response
            }
          }
        }
      `;
      const res = await sendQuery(q);
      expect(res.body.data.askHospitalAgent.success).toBe(true);
      expect(res.body.data.askHospitalAgent.data.response).toContain('cholesterol');
    });
  });
});
