'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function UpgradePage() {
  const [selectedPlan, setSelectedPlan] = useState<'1month' | '3months' | '1year' | null>(null);
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading && user && profile?.membership_type === 'premium') {
      router.push('/dashboard');
      return;
    }
  }, [user, profile, authLoading, router]);

  const plans = [
    {
      id: '1month',
      name: '1 Month',
      duration: '30 days',
      price: 50000,
      originalPrice: null,
      discount: null,
      popular: false,
      features: [
        'Access to all premium videos',
        'Complete trading blog',
        'Daily market analysis',
        '24/7 support'
      ]
    },
    {
      id: '3months',
      name: '3 Months',
      duration: '90 days',
      price: 120000,
      originalPrice: 150000,
      discount: '20%',
      popular: true,
      features: [
        'All 1 month features',
        'In-depth analysis',
        'Exclusive trading strategies',
        'Priority support',
        'Bonus: Trading e-book'
      ]
    },
    {
      id: '1year',
      name: '1 Year',
      duration: '365 days',
      price: 400000,
      originalPrice: 600000,
      discount: '33%',
      popular: false,
      features: [
        'All 3 month features',
        'Personal mentoring',
        'Real-time trading signals',
        'VIP group access',
        'Bonus: Online workshop',
        'Bonus: Premium trading tools'
      ]
    }
  ];

  const handleSelectPlan = async (planId: '1month' | '3months' | '1year') => {
    setSelectedPlan(planId);

    try {
      const selectedPlan = plans.find(plan => plan.id === planId);
      if (!selectedPlan) return;

      // Debug: Check user and profile
      console.log('User:', user);
      console.log('Profile:', profile);

      if (!user) {
        alert('Please login first');
        return;
      }

      // Create payment with Midtrans
      const response = await fetch('/api/midtrans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: selectedPlan.price,
          plan: planId,
          description: `${selectedPlan.name} Premium Subscription`,
          name: profile?.full_name || 'User',
          email: user?.email || '',
        }),
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (data.token) {
        // Redirect to Midtrans payment page
        window.location.href = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${data.token}`;
      } else {
        console.error('Payment creation failed:', data.error);
        alert(`Failed to create payment: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-indigoSteel-dark via-indigoSteel-light to-indigoSteel-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen py-12 bg-gradient-to-r from-indigoSteel-dark via-indigoSteel-light to-indigoSteel-dark">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Upgrade to Premium
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Choose the premium package that suits your trading needs
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white/10 backdrop-blur-md rounded-2xl shadow-lg p-8 flex flex-col border border-white/20 ${
                plan.popular ? 'border-2 border-yellow-500' : ''
              }`}
            >
              {plan.popular && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-yellow-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
              </span>
            </div>
              )}

              {/* Plan Header */}
            <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-white/80 mb-4">{plan.duration}</p>

                {/* Pricing */}
                <div className="mb-4">
                  {plan.originalPrice && (
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-lg text-white/70 line-through">
                        Rp {plan.originalPrice.toLocaleString()}
                      </span>
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                        Save {plan.discount}
                      </span>
                    </div>
                  )}
                  <div className="text-4xl font-bold text-white">
                    Rp {plan.price.toLocaleString()}
                  </div>
                </div>
            </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/90">{feature}</span>
              </li>
                ))}
            </ul>

              {/* Select Button */}
              <button
                onClick={() => handleSelectPlan(plan.id as '1month' | '3months' | '1year')}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition ${
                  plan.popular
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                    : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md'
                }`}
              >
                {selectedPlan === plan.id ? (
                  <>
                    <svg className="h-5 w-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
                    </svg>
                    Choose This Package
                  </>
                )}
            </button>
          </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-white mb-8">
            Why Choose Premium?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Exclusive Content</h3>
              <p className="text-white/80">
                Access to premium video tutorials, secret trading strategies, and in-depth analysis not available to free users.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Professional Analysis</h3>
              <p className="text-white/80">
                Get daily market analysis, real-time trading signals, and investment recommendations from experts.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Priority Support</h3>
              <p className="text-white/80">
                Get 24/7 support from expert team, personal mentoring, and access to VIP trader community.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
