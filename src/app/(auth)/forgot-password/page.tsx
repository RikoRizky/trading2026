'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { resetPassword } from '@/lib/auth';
import { showSuccess, showError, showInfo } from '@/lib/swal';
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
      // Add timeout to prevent stuck
      const resetPromise = resetPassword(data.email);
      const resetTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Request memakan waktu terlalu lama')), 15000)
      );

      const result = await Promise.race([resetPromise, resetTimeout]) as any;
      
      // Always set loading to false before showing notification
      setIsLoading(false);
      
      if (result?.error) {
        // Check for specific error messages
        const errorMsg = result.error.message?.toLowerCase() || '';
        
        if (errorMsg.includes('user not found') || 
            errorMsg.includes('email not found') ||
            errorMsg.includes('email tidak terdaftar')) {
          showError(
            'Email tidak terdaftar dalam sistem. Pastikan email yang Anda masukkan benar.',
            'Email Tidak Ditemukan'
          );
        } else {
          showError(
            result.error.message || 'Gagal mengirim email reset password. Silakan coba lagi.',
            'Gagal Mengirim Email'
          );
        }
        return;
      }

      // Success - show info notification immediately
      showInfo(
        `Link reset password telah dikirim ke email ${data.email}. Silakan cek inbox email Anda (termasuk folder spam). Klik link yang dikirim untuk mereset password Anda.`,
        'Cek Email Anda'
      );
      
    } catch (error: any) {
      setIsLoading(false);
      
      const errorMsg = error?.message?.toLowerCase() || '';
      
      if (errorMsg.includes('timeout')) {
        showError(
          'Waktu tunggu habis. Silakan coba lagi.',
          'Timeout'
        );
      } else {
        showError(
          error?.message || 'Terjadi kesalahan. Silakan coba lagi.',
          'Error'
        );
      }
      console.error('Forgot password error:', error);
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





