'use client';

import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { updatePassword, signOut } from '@/lib/auth';
import { showSuccess, showError, showInfo } from '@/lib/swal';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import '../../(auth)/auth-styles.css';

interface ResetFormData {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [pageState, setPageState] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const gradientDelay = useMemo(
    () => `-${(Date.now() % 15000) / 1000}s`,
    []
  );
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetFormData>();
  const password = watch('password');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    setPageState('page-ready');
    
    // Mark recovery state via cookie so middleware can block protected routes
    try {
      document.cookie = 'recovery=1; path=/; SameSite=Lax';
    } catch {}
    
    // Check if user has valid session (code should already be exchanged by callback route)
    // Code can only be used once, so we don't exchange it here
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!session || error) {
        console.log('Reset password page: No valid session');
        showError(
          'Link reset password tidak valid atau sudah kadaluarsa. Silakan request reset password baru.',
          'Link Tidak Valid'
        );
        setTimeout(() => {
          router.push('/forgot-password');
        }, 2000);
      } else {
        console.log('Reset password page: Valid session found');
      }
    };
    
    checkSession();
  }, [searchParams, router]);

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true);
    try {
      const { error } = await updatePassword(data.password);
      if (error) {
        showError(
          error.message || 'Gagal mengupdate password. Silakan coba lagi.',
          'Gagal Update Password'
        );
        setIsLoading(false);
      } else {
        // Force sign-out so user must log in again with the new password
        await signOut();
        try {
          // Clear recovery cookie when flow is complete
          document.cookie = 'recovery=; Max-Age=0; path=/; SameSite=Lax';
        } catch {}
        
        setIsLoading(false);
        
        showSuccess(
          'Password berhasil diupdate! Silakan login dengan password baru Anda.',
          'Password Berhasil Diupdate'
        );
        
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } catch (error: any) {
      setIsLoading(false);
      showError(
        error?.message || 'Terjadi kesalahan. Silakan coba lagi.',
        'Error'
      );
      console.error('Reset password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`auth-page-wrapper ${pageState}`}
      style={{ ['--authGradientDelay' as any]: gradientDelay }}
    >
      <div className={`auth-container close ${pageState === 'page-leaving' ? 'is-leaving' : ''}`}>
        <div className="auth-form-section left form-panel">
          <div className="auth-content">
            <h1>Reset Password</h1>
            <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="input-wrapper">
                <div className="password-input-wrapper">
                  <input
                    {...register('password', {
                      required: 'Password wajib diisi',
                      minLength: { 
                        value: 8, 
                        message: 'Password minimal 8 karakter' 
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Password harus mengandung huruf besar, huruf kecil, dan angka',
                      },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Password baru"
                    className={errors.password ? 'error' : ''}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span className="auth-error">{errors.password.message}</span>
                )}
              </div>

              <div className="input-wrapper">
                <div className="password-input-wrapper">
                  <input
                    {...register('confirmPassword', {
                      required: 'Konfirmasi password wajib diisi',
                      validate: (v) => v === password || 'Password tidak cocok',
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Konfirmasi password baru"
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="auth-error">{errors.confirmPassword.message}</span>
                )}
              </div>
              
              <button type="submit" disabled={isLoading} className="auth-button">
                {isLoading ? 'Mengupdate…' : 'Update Password'}
              </button>
              
              <Link href="/login" className="back-link" style={{ display: 'block', textAlign: 'center', marginTop: '1em', color: '#666', textDecoration: 'none' }}>
                Kembali ke login
              </Link>
            </form>
          </div>
        </div>
        
        <div className="auth-form-section right auth-gradient-panel front info-panel">
          <div className="auth-content" style={{ color: '#fff' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1em', display: 'block' }}>
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            <h1 style={{ color: '#fff', marginBottom: '0.5em' }}>Buat Password Baru</h1>
            <p style={{ color: '#fff', margin: '2em auto', fontSize: '1.4em' }}>Masukkan password baru yang kuat dan mudah diingat untuk keamanan akun Anda</p>
          </div>
        </div>
      </div>
    </div>
  );
}


