'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { resetPassword } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import '../auth-styles.css';

interface ForgotFormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [pageState, setPageState] = useState('');
  const gradientDelay = useMemo(
    () => `-${(Date.now() % 15000) / 1000}s`,
    []
  );
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotFormData>();

  useEffect(() => {
    setPageState('page-ready');
  }, []);

  const onSubmit = async (data: ForgotFormData) => {
    setIsLoading(true);
    try {
      const { error } = await resetPassword(data.email);
      if (error) {
        toast.error(error.message || 'Failed to send reset email');
      } else {
        toast.success('Reset link sent. Check your email.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Forgot password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`auth-page-wrapper ${pageState}`}
      style={{ ['--authGradientDelay' as any]: gradientDelay }}
    >
      <div className="forgot-password-container">
        <h1>Forgot your password?</h1>
        <p>Enter your email and we'll send you a reset link.</p>
        
        <form className="forgot-password-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="input-wrapper">
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email address',
                },
              })}
              type="email"
              autoComplete="email"
              placeholder="email"
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="auth-error">{errors.email.message}</span>}
          </div>
          
          <button type="submit" disabled={isLoading} className="auth-button">
            {isLoading ? 'Sending…' : 'Send reset link'}
          </button>
          
          <Link href="/login" className="back-link">Back to login</Link>
        </form>
      </div>
    </div>
  );
}





