'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { signIn, signInWithGoogle } from '@/lib/auth';
import { showSuccess, showError, showInfo } from '@/lib/swal';
import { createClient } from '@/lib/supabase/client';
import '../auth-styles.css';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [containerClass, setContainerClass] = useState('');
  const [pageState, setPageState] = useState('');
  const gradientDelay = useMemo(
    () => `-${(Date.now() % 15000) / 1000}s`,
    []
  );
  const router = useRouter();
  const searchParams = useSearchParams();
 
  // If user arrives at login after starting a password recovery, clear recovery flag
  useEffect(() => {
    try {
      document.cookie = 'recovery=; Max-Age=0; path=/; SameSite=Lax';
    } catch {}
    
    // Set initial container class for login page
    // 'close' class shows login form on left, welcome panel on right (normal login view)
    setContainerClass('close');
    setPageState('page-ready');
    
    // Check for error parameter in URL and show notification
    const error = searchParams.get('error');
    if (error === 'not_verified') {
      showInfo(
        'Email Anda belum diverifikasi. Silakan cek inbox email Anda (termasuk folder spam) untuk link verifikasi.',
        'Email Belum Diverifikasi'
      );
      // Clean up URL
      router.replace('/login');
    }
  }, [searchParams, router]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    try {
      // Call signIn with timeout to prevent stuck
      const signInPromise = signIn(data.email, data.password);
      const signInTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Login memakan waktu terlalu lama')), 10000)
      );

      const signInData = await Promise.race([signInPromise, signInTimeout]) as any;
      
      const user = signInData?.user;
      if (!user) {
        await showError(
          "Sesi user tidak ditemukan. Silakan coba lagi.",
          "Login Gagal"
        );
        setIsLoading(false);
        return;
      }

      // Use the client from our lib to ensure consistency
      const supabase = createClient();

      // Fetch profile with timeout to prevent stuck
      const profilePromise = supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      const profileTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Gagal memuat profil')), 5000)
      );

      let profileResult;
      try {
        profileResult = await Promise.race([profilePromise, profileTimeout]) as any;
      } catch (profileErr: any) {
        // If profile fetch fails, log but don't block login
        console.warn('Profile fetch error:', profileErr);
        profileResult = { data: { is_admin: false }, error: null };
      }

      if (profileResult?.error && profileResult.error.code !== 'PGRST116') {
        // PGRST116 is "not found" which is okay, we'll create profile
        console.error(profileResult.error);
        await showError(
          "Gagal memuat profil. Silakan coba lagi.",
          "Error Memuat Profil"
        );
        setIsLoading(false);
        return;
      }

      const profile = profileResult?.data || { is_admin: false };

      // Show success notification immediately
      showSuccess("Berhasil login!", "Login Berhasil");

      // ✅ REDIRECT BASED ON ADMIN ROLE
      if (profile?.is_admin === true) {
        setTimeout(() => {
          window.location.href = "/admin";
        }, 1500);
      } else {
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }

    } catch (error: any) {
      // Always set loading to false in catch block
      setIsLoading(false);
      
      // Handle specific error messages
      let errorMessage = 'Terjadi kesalahan saat login. Silakan coba lagi.';
      let errorTitle = 'Login Gagal';

      if (error?.message) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('invalid login credentials') || 
            errorMsg.includes('email atau password salah') ||
            errorMsg.includes('wrong password') ||
            errorMsg.includes('invalid password')) {
          errorMessage = 'Email atau password salah. Pastikan email dan password yang Anda masukkan benar.';
          errorTitle = 'Email/Password Salah';
        } else if (errorMsg.includes('user not found') || 
                   errorMsg.includes('email not found') ||
                   errorMsg.includes('user tidak ditemukan')) {
          errorMessage = 'Email tidak terdaftar dalam sistem. Pastikan email yang Anda masukkan benar atau daftar terlebih dahulu.';
          errorTitle = 'Email Tidak Terdaftar';
        } else if (errorMsg.includes('email belum diverifikasi') ||
                   errorMsg.includes('email not verified') ||
                   errorMsg.includes('not verified')) {
          errorMessage = 'Email Anda belum diverifikasi. Silakan cek inbox email Anda untuk link verifikasi.';
          errorTitle = 'Email Belum Diverifikasi';
        } else if (errorMsg.includes('timeout')) {
          errorMessage = 'Waktu tunggu habis. Silakan coba lagi.';
          errorTitle = 'Timeout';
        } else {
          errorMessage = error.message || errorMessage;
        }
      }

      // Show error notification immediately
      showError(errorMessage, errorTitle);
      console.error('Login error:', error);
    }
  };

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setContainerClass('active');
    setPageState('page-leaving');
    setTimeout(() => {
      router.push('/register');
    }, 300);
  };

  return (
    <div
      className={`auth-page-wrapper ${pageState}`}
      style={{ ['--authGradientDelay' as any]: gradientDelay }}
    >
      <div className={`auth-container ${containerClass} ${pageState === 'page-leaving' ? 'is-leaving' : ''}`}>
        <div className="auth-form-section left form-panel">
          <div className="auth-content">
            <h1>Log In</h1>
            <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
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
              
              <div className="password-input-wrapper">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
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
                {errors.password && (
                  <span className="auth-error">{errors.password.message}</span>
                )}
              </div>
              
              <div className="remember-forget-wrapper">
                <span className="remember">Remember me</span>
                <Link href="/forgot-password" className="forget">
                  Forgot password?
                </Link>
              </div>
              
              <button type="submit" disabled={isLoading} className="auth-button">
                {isLoading ? 'Signing in...' : 'Log In'}
              </button>
              
              <span className="loginwith">Or Connect with</span>
              
              <div className="auth-social-icons">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const { error } = await signInWithGoogle();
                      if (error) {
                        await showError(error.message || 'Failed to sign in with Google');
                      }
                    } catch (error) {
                      await showError('An unexpected error occurred');
                      console.error('Google sign in error:', error);
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="auth-form-section right auth-gradient-panel front info-panel">
          <div className="auth-content" style={{ color: '#fff' }}>
            
            <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1em', display: 'block' }}>
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            <h1 style={{ color: '#fff', marginBottom: '0.5em' }}>Welcome Back!</h1>
            <p style={{ color: '#fff', margin: '2em auto', fontSize: '1.4em' }}>To keep connected with us please login with your personal info</p>
            <button type="button" className="auth-button" onClick={handleRegisterClick} style={{ borderColor: '#fff', background: 'transparent', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5em' }}>
              <span>Register</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 16 16 12 12 8"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

