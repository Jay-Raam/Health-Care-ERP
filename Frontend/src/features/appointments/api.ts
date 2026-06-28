import { graphqlRequest } from '../../api/client';
import type { Appointment, Doctor, Patient } from '../../types';

// Helper: Convert "09:00 AM" to "09:00" and "01:00 PM" to "13:00"
export function formatTime12to24(time12: string): string {
  const [time, modifier] = time12.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') {
    hours = '00';
  }
  if (modifier === 'PM') {
    hours = String(parseInt(hours, 10) + 12);
  }
  return `${hours.padStart(2, '0')}:${minutes}`;
}

// Helper: Convert "09:00" to "09:00 AM" and "13:00" to "01:00 PM"
export function formatTime24to12(time24: string): string {
  let [hoursStr, minutes] = time24.split(':');
  let hours = parseInt(hoursStr, 10);
  const modifier = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) {
    hours -= 12;
  } else if (hours === 0) {
    hours = 12;
  }
  return `${String(hours).padStart(2, '0')}:${minutes} ${modifier}`;
}

// Helper: Calculate 30-minute end time for HH:MM format
export function calculateEndTime(startTime24: string): string {
  let [hoursStr, minutesStr] = startTime24.split(':');
  let hours = parseInt(hoursStr, 10);
  let minutes = parseInt(minutesStr, 10);
  minutes += 30;
  if (minutes >= 60) {
    minutes -= 60;
    hours = (hours + 1) % 24;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

const mapGraphQLAppointment = (apt: any): Appointment => {
  const patientName = apt.patient?.user 
    ? `${apt.patient.user.firstName} ${apt.patient.user.lastName}`.trim() 
    : (apt.patient?.name || 'Unknown Patient');
  
  const doctorName = apt.doctor?.user 
    ? `Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`.trim() 
    : (apt.doctor?.name || 'Unknown Doctor');

  let formattedDate = apt.appointmentDate;
  try {
    const d = new Date(formattedDate);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toISOString().split('T')[0];
    }
  } catch (e) {
    if (formattedDate.includes('T')) {
      formattedDate = formattedDate.split('T')[0];
    }
  }

  let type: 'Consultation' | 'Follow-up' | 'Emergency' | 'Operation' | 'Lab Review' = 'Consultation';
  if (apt.reason) {
    if (apt.reason.startsWith('Consultation') || apt.reason.includes('Consultation')) {
      type = 'Consultation';
    } else if (apt.reason.startsWith('Follow-up') || apt.reason.includes('Follow-up')) {
      type = 'Follow-up';
    } else if (apt.reason.startsWith('Emergency') || apt.reason.includes('Emergency')) {
      type = 'Emergency';
    } else if (apt.reason.startsWith('Operation') || apt.reason.includes('Operation')) {
      type = 'Operation';
    } else if (apt.reason.startsWith('Lab Review') || apt.reason.includes('Lab Review')) {
      type = 'Lab Review';
    }
  }

  return {
    id: apt.id,
    patientId: apt.patient?.id || '',
    patientName,
    doctorId: apt.doctor?.id || '',
    doctorName,
    date: formattedDate,
    time: formatTime24to12(apt.startTime),
    type,
    status: apt.status as any,
    notes: apt.clinicalNotes || apt.reason || ''
  };
};

const mapGraphQLDoctor = (doc: any): Doctor => {
  const name = doc.user 
    ? `Dr. ${doc.user.firstName} ${doc.user.lastName}`.trim() 
    : 'Unknown Doctor';
  
  const availability = (doc.availability || []).map((av: any) => {
    const day = av.dayOfWeek.charAt(0) + av.dayOfWeek.slice(1).toLowerCase();
    return {
      day,
      slots: [formatTime24to12(av.startTime)]
    };
  });

  return {
    id: doc.id,
    name,
    email: doc.user?.email || '',
    phone: '+1 (555) 019-2834',
    specialization: doc.specialty,
    department: doc.specialty,
    availability: availability.length > 0 ? availability : [
      { day: 'Monday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'] },
      { day: 'Tuesday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'] },
      { day: 'Wednesday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'] },
      { day: 'Thursday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'] },
      { day: 'Friday', slots: ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'] }
    ],
    status: doc.isAvailableToday ? 'Active' : 'Busy',
    rating: doc.rating || 5.0
  };
};

const mapGraphQLPatient = (pat: any): Patient => {
  const name = pat.user 
    ? `${pat.user.firstName} ${pat.user.lastName}`.trim() 
    : 'Unknown Patient';
  
  return {
    id: pat.id,
    name,
    email: pat.user?.email || '',
    phone: pat.phone || '',
    dob: pat.dateOfBirth ? pat.dateOfBirth.split('T')[0] : '1990-01-01',
    gender: pat.gender === 'MALE' ? 'Male' : pat.gender === 'FEMALE' ? 'Female' : 'Other',
    bloodType: pat.bloodType || 'O+',
    address: pat.address || '',
    allergies: pat.allergies || [],
    medicalHistory: pat.medicalHistory || [],
    documents: []
  };
};

export async function getMyAppointments(): Promise<Appointment[]> {
  const query = `
    query GetMyAppointments {
      myAppointments {
        id
        patient {
          id
          user {
            id
            firstName
            lastName
          }
        }
        doctor {
          id
          user {
            id
            firstName
            lastName
          }
        }
        appointmentDate
        startTime
        endTime
        status
        reason
        clinicalNotes
        queueNumber
      }
    }
  `;
  const data = await graphqlRequest<any>(query);
  return (data.myAppointments || []).map(mapGraphQLAppointment);
}

export async function getDoctorsList(): Promise<Doctor[]> {
  const query = `
    query GetDoctorsList {
      doctorsList {
        id
        user {
          id
          firstName
          lastName
          email
        }
        specialty
        consultationFee
        biography
        availability {
          dayOfWeek
          startTime
          endTime
        }
        rating
        isAvailableToday
      }
    }
  `;
  const data = await graphqlRequest<any>(query);
  return (data.doctorsList || []).map(mapGraphQLDoctor);
}

export async function searchPatients(term: string = ''): Promise<Patient[]> {
  const query = `
    query SearchPatients($term: String!) {
      searchPatients(term: $term) {
        id
        user {
          id
          firstName
          lastName
          email
        }
        phone
        gender
        bloodType
        address
        dateOfBirth
        allergies
        medicalHistory
      }
    }
  `;
  const data = await graphqlRequest<any>(query, { term });
  return (data.searchPatients || []).map(mapGraphQLPatient);
}

export async function bookAppointment(input: {
  doctorId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  patientId?: string;
}): Promise<Appointment> {
  const mutation = `
    mutation BookAppointment($input: BookAppointmentInput!) {
      bookAppointment(input: $input) {
        id
        patient {
          id
          user {
            id
            firstName
            lastName
          }
        }
        doctor {
          id
          user {
            id
            firstName
            lastName
          }
        }
        appointmentDate
        startTime
        endTime
        status
        reason
        clinicalNotes
        queueNumber
      }
    }
  `;
  const data = await graphqlRequest<any>(mutation, { input });
  return mapGraphQLAppointment(data.bookAppointment);
}

export async function updateAppointmentStatus(
  id: string,
  status: string,
  clinicalNotes?: string
): Promise<Appointment> {
  const mutation = `
    mutation UpdateAppointmentStatus($id: ID!, $status: String!, $clinicalNotes: String) {
      updateAppointmentStatus(id: $id, status: $status, clinicalNotes: $clinicalNotes) {
        id
        patient {
          id
          user {
            id
            firstName
            lastName
          }
        }
        doctor {
          id
          user {
            id
            firstName
            lastName
          }
        }
        appointmentDate
        startTime
        endTime
        status
        reason
        clinicalNotes
        queueNumber
      }
    }
  `;
  const data = await graphqlRequest<any>(mutation, { id, status, clinicalNotes });
  return mapGraphQLAppointment(data.updateAppointmentStatus);
}

export async function rescheduleAppointment(
  id: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<Appointment> {
  const mutation = `
    mutation RescheduleAppointment($id: ID!, $date: String!, $startTime: String!, $endTime: String!) {
      rescheduleAppointment(id: $id, date: $date, startTime: $startTime, endTime: $endTime) {
        id
        patient {
          id
          user {
            id
            firstName
            lastName
          }
        }
        doctor {
          id
          user {
            id
            firstName
            lastName
          }
        }
        appointmentDate
        startTime
        endTime
        status
        reason
        clinicalNotes
        queueNumber
      }
    }
  `;
  const data = await graphqlRequest<any>(mutation, { id, date, startTime, endTime });
  return mapGraphQLAppointment(data.rescheduleAppointment);
}
