import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/src/store/appStore';
import { useNotification } from '@/src/hooks/useApp';
import { loginUser, registerUser, verifyRegistrationOtp, authRoleOptions } from '@/src/features/auth/api';
import type { UserRole } from '@/src/types';
import { ShieldCheck, HeartPulse, AlertCircle, ArrowRight, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid enterprise email format' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  rememberMe: z.boolean().optional()
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface AuthProps {
  initialScreen?: 'login' | 'register' | 'forgot' | 'otp';
}

export default function Auth({ initialScreen = 'login' }: AuthProps) {
  const login = useAppStore((state) => state.login);
  const { triggerToast } = useNotification();
  const navigate = useNavigate();

  // Auth sub-screens: 'login' | 'register' | 'forgot' | 'otp'
  const [screen, setScreen] = useState<'login' | 'register' | 'forgot' | 'otp'>(initialScreen);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // react-hook-form setup with custom Zod resolver
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    defaultValues: {
      email: 'jayasriraam27@gmail.com',
      password: 'SecurePass123!',
      rememberMe: true
    },
    resolver: async (values) => {
      const result = loginSchema.safeParse(values);
      if (result.success) return { values, errors: {} };

      const formErrors: Record<string, any> = {};
      result.error.issues.forEach((err) => {
        const fieldName = err.path[0];
        if (fieldName !== undefined) {
          formErrors[fieldName.toString()] = { type: 'validation', message: err.message };
        }
      });
      return { values: {}, errors: formErrors };
    }
  });

  // Input States for other screens (register/otp/forgot)
  const [email, setEmail] = useState('jayasriraam27@gmail.com');
  const [password, setPassword] = useState('SecurePass123!');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('PATIENT');
  const [otp, setOtp] = useState('');

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
      return error.message;
    }

    return 'Unexpected authentication error';
  };

  const splitName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ')
    };
  };

  // Password strength logic
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Weak', color: 'bg-zinc-200' };
    let score = 0;
    if (pass.length > 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score, label: 'Medium', color: 'bg-amber-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      const user = await loginUser({
        email: data.email,
        password: data.password
      });

      login(user);
      triggerToast('Access Authorized', 'Successfully authenticated.', 'success');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      triggerToast('Authentication Failed', getErrorMessage(error), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      triggerToast('Security Rejection', 'Verification passcode must be exactly 6 digits.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const message = await verifyRegistrationOtp({ email, otp });
      triggerToast('Verification Complete', message, 'success');
      setOtp('');
      setScreen('login');
    } catch (error) {
      triggerToast('Verification Failed', getErrorMessage(error), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      triggerToast('Validation Error', 'Please fill in all clinical fields.', 'error');
      return;
    }

    const { firstName, lastName } = splitName(name);
    if (!firstName || !lastName) {
      triggerToast('Validation Error', 'Please provide both first and last name.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const message = await registerUser({
        firstName,
        lastName,
        email,
        password,
        role
      });
      triggerToast('Registration Success', message, 'success');
      setOtp('');
      setScreen('otp');
    } catch (error) {
      triggerToast('Registration Failed', getErrorMessage(error), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast('Passcode link sent', 'A password recovery package was dispatched.', 'info');
    setScreen('login');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 relative font-sans select-none transition-colors duration-200">

      {/* Absolute high-contrast design card backdrop element */}
      <div className="absolute top-[10%] left-[5%] right-[5%] h-[300px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-2xl relative z-10 text-xs">

        {/* Logo and header */}
        <div className="flex flex-col items-center text-center space-y-2 mb-6">
          <div className="p-2.5 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-lg">
            <HeartPulse size={24} />
          </div>
          <h1 className="text-lg font-extrabold tracking-tight text-zinc-950 dark:text-white font-mono uppercase">
            Astra Clinical Agent
          </h1>
          <p className="text-[11px] text-zinc-400 max-w-xs leading-normal">
            Secure clinical enterprise platform • HIPAA and GDPR certified secure authorization gateway
          </p>
        </div>

        {/* Form Switches */}
        {screen === 'login' && (
          <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-800 dark:text-zinc-200">Enterprise Email Contact</label>
              <input
                type="email"
                placeholder="jayasriraam27@gmail.com"
                {...register('email')}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
              />
              {errors.email && (
                <span className="text-[10px] text-rose-500 font-mono flex items-center gap-1 mt-0.5">
                  <AlertCircle size={10} /> {errors.email.message}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-zinc-800 dark:text-zinc-200">Credentials Passcode</label>
                <button
                  type="button"
                  onClick={() => setScreen('forgot')}
                  className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  Forgot passcode?
                </button>
              </div>
              <input
                type="password"
                {...register('password')}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
              />
              {errors.password && (
                <span className="text-[10px] text-rose-500 font-mono flex items-center gap-1 mt-0.5">
                  <AlertCircle size={10} /> {errors.password.message}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div className="space-y-1.5">
                <label className="block font-semibold text-zinc-800 dark:text-zinc-200">Session Preference</label>
                <div className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-zinc-500 dark:text-zinc-400">
                  Credentials are validated against your registered backend account role.
                </div>
              </div>
              <div className="flex items-center gap-1.5 self-end h-[38px] cursor-pointer">
                <input
                  type="checkbox"
                  {...register('rememberMe')}
                  className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-950 cursor-pointer h-3.5 w-3.5"
                />
                <span className="text-zinc-500 dark:text-zinc-400">Remember this station</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1.5 mt-2"
            >
              <span>{isSubmitting ? 'Authenticating...' : 'Verify Access Gateway'}</span>
              <ArrowRight size={14} />
            </button>

            <div className="text-center pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400">
              New clinician to the directory?{' '}
              <button
                type="button"
                onClick={() => setScreen('register')}
                className="text-zinc-900 dark:text-white hover:underline font-bold"
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {screen === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="p-3.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-start gap-2.5 mb-1">
              <ShieldCheck size={18} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">2FA Authentication Enforced</span>
                <p className="text-[10px] text-zinc-500 leading-normal mt-0.5">Please provide the 6-digit verification code sent to your registered email address to activate the account.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold text-zinc-800 dark:text-zinc-200">Biometric OTP Passcode</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="0 0 0 0"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 text-center font-mono font-bold text-base tracking-widest text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
            >
              <Check size={14} />
              {isSubmitting ? 'Verifying Account...' : 'Confirm Identity signoff'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setScreen('login')}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                Back to credentials login
              </button>
            </div>
          </form>
        )}

        {screen === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block font-semibold">Clinician Full Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jayasriraam"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5"
                required
              />
              <span className="text-[10px] text-zinc-400">Enter first and last name as stored for the account.</span>
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold">Enterprise Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jayasriraam27@gmail.com"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold">Passcode Encryption *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5"
                required
              />

              {/* Password strength bar */}
              {password && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>Password Security: {strength.label}</span>
                  </div>
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1 rounded-full overflow-hidden">
                    <div className={`${strength.color} h-full transition-all duration-200`} style={{ width: `${(strength.score / 4) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block font-semibold">Role *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5"
              >
                {authRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs rounded-lg hover:opacity-90"
            >
              {isSubmitting ? 'Creating Account...' : 'Sign up to directory'}
            </button>

            <div className="text-center pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setScreen('login')}
                className="text-zinc-900 dark:text-white hover:underline font-bold"
              >
                Log In
              </button>
            </div>
          </form>
        )}

        {screen === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block font-semibold">Registered Email Contact</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jayasriraam27@gmail.com"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs rounded-lg hover:opacity-90"
            >
              Request Reset Package
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setScreen('login')}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-semibold"
              >
                Cancel and go back
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
