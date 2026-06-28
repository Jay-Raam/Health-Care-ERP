import { graphqlRequest, setAccessToken } from '@/src/api/client';
import type { UserProfile, UserRole } from '@/src/types';

type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
};

type LoginMutationResponse = {
  login: {
    success: boolean;
    message: string;
    data: {
      accessToken: string;
      refreshToken: string;
      user: AuthUser;
    } | null;
  };
};

type RegisterMutationResponse = {
  register: {
    success: boolean;
    message: string;
  };
};

type VerifyOtpMutationResponse = {
  verifyOtp: {
    success: boolean;
    message: string;
  };
};

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=120';

const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      success
      message
      data {
        accessToken
        refreshToken
        user {
          id
          email
          firstName
          lastName
          role
        }
      }
    }
  }
`;

const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      success
      message
    }
  }
`;

const VERIFY_OTP_MUTATION = `
  mutation VerifyOtp($input: VerifyOtpInput!) {
    verifyOtp(input: $input) {
      success
      message
    }
  }
`;

export const authRoleOptions: Array<{ value: UserRole; label: string }> = [
  { value: 'PATIENT', label: 'Patient' },
  { value: 'DOCTOR', label: 'Doctor' },
  { value: 'RECEPTIONIST', label: 'Receptionist' },
  { value: 'LAB_TECHNICIAN', label: 'Lab Technician' },
  { value: 'HOSPITAL_ADMIN', label: 'Hospital Admin' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' }
];

const toUserProfile = (user: AuthUser): UserProfile => ({
  id: user.id,
  name: `${user.firstName} ${user.lastName}`.trim(),
  email: user.email,
  role: user.role,
  avatar: DEFAULT_AVATAR
});

export async function loginUser(input: { email: string; password: string }): Promise<UserProfile> {
  const data = await graphqlRequest<LoginMutationResponse>(LOGIN_MUTATION, { input });
  const result = data.login;

  if (!result.success || !result.data) {
    throw new Error(result.message || 'Login failed');
  }

  setAccessToken(result.data.accessToken);
  return toUserProfile(result.data.user);
}

export async function registerUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<string> {
  const data = await graphqlRequest<RegisterMutationResponse>(REGISTER_MUTATION, { input });
  const result = data.register;

  if (!result.success) {
    throw new Error(result.message || 'Registration failed');
  }

  return result.message;
}

export async function verifyRegistrationOtp(input: { email: string; otp: string }): Promise<string> {
  const data = await graphqlRequest<VerifyOtpMutationResponse>(VERIFY_OTP_MUTATION, { input });
  const result = data.verifyOtp;

  if (!result.success) {
    throw new Error(result.message || 'OTP verification failed');
  }

  return result.message;
}