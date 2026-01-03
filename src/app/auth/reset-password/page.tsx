'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { updatePassword, signOut } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { useSearchParams, useRouter } from 'next/navigation';

interface ResetFormData {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetFormData>();
  const password = watch('password');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Mark recovery state via cookie so middleware can block protected routes
    try {
      document.cookie = 'recovery=1; path=/; SameSite=Lax';
    } catch {}
    // Optional: validate presence of code in URL
    const code = searchParams.get('code');
    if (!code) {
      // continue; backend will reject update if no valid session
    }
  }, [searchParams]);

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    try {
      const { error } = await updatePassword(data.password);
      if (error) {
        toast.error(error.message || 'Failed to update password');
      } else {
        // Force sign-out so user must log in again with the new password
        await signOut();
        try {
          // Clear recovery cookie when flow is complete
          document.cookie = 'recovery=; Max-Age=0; path=/; SameSite=Lax';
        } catch {}
        toast.success('Password updated. Please log in with the new password.');
        router.push('/login');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Reset password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set a new password
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="password" className="form-label">New Password</label>
            <input
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'At least 8 characters' },
              })}
              type="password"
              autoComplete="new-password"
              className="input"
              placeholder="Enter new password"
            />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (v) => v === password || 'Passwords do not match',
              })}
              type="password"
              autoComplete="new-password"
              className="input"
              placeholder="Confirm new password"
            />
            {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={isLoading} className="btn btn-primary btn-lg w-full">
            {isLoading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}


