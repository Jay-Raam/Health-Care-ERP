export const typeDefs = `
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    role: String!
  }

  type TokenResponse {
    accessToken: String!
    refreshToken: String!
  }

  type AuthData {
    accessToken: String!
    refreshToken: String!
    user: User!
  }

  type GenericResponse {
    success: Boolean!
    message: String!
  }

  type AuthResponse {
    success: Boolean!
    message: String!
    data: AuthData
  }

  type TokenRefreshResponse {
    success: Boolean!
    message: String!
    data: TokenResponse
  }

  type Patient {
    id: ID!
    user: User
    dateOfBirth: String!
    gender: String!
    phone: String!
    address: String!
    bloodType: String
    allergies: [String]
    medicalHistory: [String]
  }

  type PatientResponse {
    success: Boolean!
    message: String!
    data: Patient
  }

  type SearchPatientsResponse {
    success: Boolean!
    message: String!
    data: [Patient]
  }

  type DoctorAvailability {
    dayOfWeek: String!
    startTime: String!
    endTime: String!
  }

  type Doctor {
    id: ID!
    user: User
    specialty: String!
    licenseNumber: String!
    consultationFee: Float!
    biography: String
    availability: [DoctorAvailability]
    rating: Float
    isAvailableToday: Boolean
  }

  type DoctorResponse {
    success: Boolean!
    message: String!
    data: Doctor
  }

  type Appointment {
    id: ID!
    patient: Patient
    doctor: Doctor
    appointmentDate: String!
    startTime: String!
    endTime: String!
    status: String!
    reason: String!
    clinicalNotes: String
    queueNumber: Int
  }

  type AppointmentResponse {
    success: Boolean!
    message: String!
    data: Appointment
  }

  type BillItem {
    description: String!
    quantity: Int!
    unitPrice: Float!
  }

  type Bill {
    id: ID!
    patient: Patient
    appointment: Appointment
    items: [BillItem]!
    totalAmount: Float!
    status: String!
    pdfPath: String
  }

  type BillResponse {
    success: Boolean!
    message: String!
    data: Bill
  }

  type LabReport {
    id: ID!
    patient: Patient
    doctor: Doctor
    testName: String!
    resultSummary: String
    status: String!
    fileUrl: String!
    ocrResult: String
  }

  type LabReportResponse {
    success: Boolean!
    message: String!
    data: LabReport
  }

  type AIResult {
    response: String!
  }

  type AIResponse {
    success: Boolean!
    message: String!
    data: AIResult
  }

  # Inputs
  input RegisterInput {
    firstName: String!
    lastName: String!
    email: String!
    password: String!
    role: String
  }

  input LoginInput {
    email: String!
    password: String!
    deviceInfo: String
    ipAddress: String
  }

  input VerifyOtpInput {
    email: String!
    otp: String!
  }

  input ResetPasswordInput {
    email: String!
    otp: String!
    newPassword: String!
  }

  input RefreshTokenInput {
    refreshToken: String!
  }

  input CreatePatientInput {
    dateOfBirth: String!
    gender: String!
    phone: String!
    address: String!
    bloodType: String
    allergies: [String]
    medicalHistory: [String]
  }

  input AvailabilityInput {
    dayOfWeek: String!
    startTime: String!
    endTime: String!
  }

  input CreateDoctorInput {
    specialty: String!
    licenseNumber: String!
    consultationFee: Float!
    biography: String
    availability: [AvailabilityInput]
  }

  input BookAppointmentInput {
    doctorId: String!
    appointmentDate: String!
    startTime: String!
    endTime: String!
    reason: String!
    patientId: String
  }

  input BillItemInput {
    description: String!
    quantity: Int!
    unitPrice: Float!
  }

  input CreateBillInput {
    patientId: String!
    appointmentId: String
    items: [BillItemInput]!
  }

  input UploadLabReportInput {
    patientId: String!
    doctorId: String
    testName: String!
    fileUrl: String!
  }

  type Query {
    # Patient queries
    patientProfile(id: ID!): Patient
    myPatientProfile: Patient
    searchPatients(term: String!): [Patient]

    # Doctor queries
    doctorsList: [Doctor]
    doctorProfile(id: ID!): Doctor

    # Appointment queries
    myAppointments: [Appointment]
    doctorSchedule(doctorId: ID!, date: String!): [Appointment]

    # Billing queries
    myBills: [Bill]

    # Lab queries
    myLabReports: [LabReport]
  }

  type Mutation {
    # Auth mutations
    register(input: RegisterInput!): AuthResponse!
    login(input: LoginInput!): AuthResponse!
    verifyOtp(input: VerifyOtpInput!): GenericResponse!
    requestOtp(email: String!): GenericResponse!
    resetPassword(input: ResetPasswordInput!): GenericResponse!
    refreshToken(input: RefreshTokenInput!): TokenRefreshResponse!
    logout(token: String!): GenericResponse!

    # Patient mutations
    createPatientProfile(input: CreatePatientInput!): Patient!
    updatePatientProfile(id: ID!, input: CreatePatientInput!): Patient!

    # Doctor mutations
    createDoctorProfile(input: CreateDoctorInput!): Doctor!
    updateDoctorProfile(id: ID!, input: CreateDoctorInput!): Doctor!

    # Appointment mutations
    bookAppointment(input: BookAppointmentInput!): Appointment!
    updateAppointmentStatus(id: ID!, status: String!, clinicalNotes: String): Appointment!
    rescheduleAppointment(id: ID!, date: String!, startTime: String!, endTime: String!): Appointment!

    # Billing mutations
    createBill(input: CreateBillInput!): Bill!
    payBill(id: ID!): Bill!

    # Lab mutations
    uploadLabReport(input: UploadLabReportInput!): LabReport!

    # AI mutations
    askHospitalAgent(query: String!): AIResponse!
  }

  type Subscription {
    appointmentBooked: Appointment!
    billSettled: Bill!
  }
`;
export default typeDefs;
