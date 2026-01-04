'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { signUp } from '@/lib/auth';
import { showSuccess, showError, showInfo } from '@/lib/swal';
import '../auth-styles.css';

interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [containerClass, setContainerClass] = useState('');
  const [pageState, setPageState] = useState('');
  const gradientDelay = useMemo(
    () => `-${(Date.now() % 15000) / 1000}s`,
    []
  );
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();
  const password = watch('password');

  useEffect(() => {
    // Set initial container class untuk animasi
    setContainerClass('active');
    setPageState('page-ready');
  }, []);

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setContainerClass('close');
    setPageState('page-leaving');
    setTimeout(() => {
      router.push('/login');
    }, 300);
  };

  const onSubmit = async (form: RegisterFormData) => {
      setIsLoading(true);

      try {
        const { data: signUpData, error: signUpError } = 
          await signUp(form.email, form.password, form.fullName);

        if (signUpError) {
          showError(
            signUpError.message || 'Gagal membuat akun. Silakan coba lagi.',
            'Registrasi Gagal'
          );
          setIsLoading(false);
          return;
        }

        // Show success notification with email confirmation message
        showInfo(
          'Akun berhasil dibuat! Silakan cek inbox email Anda (termasuk folder spam) untuk link konfirmasi akun.',
          'Cek Email Anda'
        );

        // Redirect to login after a short delay
        setTimeout(() => {
          router.push("/login");
        }, 2000);

      } catch (err: any) {
        console.error("REGISTER ERROR:", err);
        showError(
          err.message || 'Terjadi kesalahan. Silakan coba lagi.',
          'Error'
        );
        setIsLoading(false);
      }
    };

  return (
    <div
      className={`auth-page-wrapper ${pageState}`}
      style={{ ['--authGradientDelay' as any]: gradientDelay }}
    >
      <div className={`auth-container ${containerClass} ${pageState === 'page-leaving' ? 'is-leaving' : ''}`}>
        <div className="auth-form-section right form-panel">
          <div className="auth-content">
            <h1>Sign Up</h1>
            
            {/* <div className="auth-social-icons">
              <a href="#">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a href="#">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
                </svg>
              </a>
              <a href="#">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                </svg>
              </a>
              <a href="#">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect x="2" y="9" width="4" height="12"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
            </div> */}
            
            {/* <span className="loginwith">Or</span> */}
            
            <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="input-wrapper">
                <input
                  {...register('fullName', {
                    required: 'Full name is required',
                    minLength: {
                      value: 2,
                      message: 'Full name must be at least 2 characters',
                    },
                  })}
                  type="text"
                  autoComplete="name"
                  placeholder="name"
                  className={errors.fullName ? 'error' : ''}
                />
                {errors.fullName && (
                  <span className="auth-error">{errors.fullName.message}</span>
                )}
              </div>
              
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
                {errors.email && (
                  <span className="auth-error">{errors.email.message}</span>
                )}
              </div>
              
              <div className="input-wrapper">
                <div className="password-input-wrapper">
                  <input
                    {...register('password', {
                      required: 'Password wajib diisi',
                      minLength: {
                        value: 8,
                        message: 'Password minimal 8 karakter',
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Password harus mengandung huruf besar, huruf kecil, dan angka',
                      },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="password"
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
                    placeholder="confirm password"
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
              
              <div style={{ position: 'relative', float: 'left', margin: '-20px 0' }}>
                <label>
                  <input
                    {...register('agreeToTerms', {
                      required: 'You must agree to the terms and conditions',
                    })}
                    type="checkbox"
                    style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                  />
                  <span className="remember">I accept terms</span>
                </label>
                {errors.agreeToTerms && (
                  <span className="auth-error">{errors.agreeToTerms.message}</span>
                )}
              </div>
              <span className="clearfix"></span>
              
              <button type="submit" disabled={isLoading} className="auth-button">
                {isLoading ? 'Creating account...' : 'Register'}
              </button>
            </form>
          </div>
        </div>
        
        <div className="auth-form-section left auth-gradient-panel back info-panel">
          <div className="auth-content" style={{ color: '#fff' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1em', display: 'block' }}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            <h1 style={{ color: '#fff', marginBottom: '0.5em' }}>Hello, friend!</h1>
            <p style={{ color: '#fff', margin: '2em auto', fontSize: '1.4em' }}>Enter your personal details and start journey with us</p>
            <button type="button" className="auth-button" onClick={handleLoginClick} style={{ borderColor: '#fff', background: 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5em' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 8 8 12 12 16"/>
                <line x1="16" y1="12" x2="8" y2="12"/>
              </svg>
              <span>Log In</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
