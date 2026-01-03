"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  CreditCardIcon,
  QrCodeIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  ArrowLeftIcon,
  CheckIcon
} from "@heroicons/react/24/outline";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();

  const selectedPlan = searchParams.get('plan');

  // Plan configurations
  const plans = {
    '1month': { name: '1 Bulan', duration: '30 hari', price: 50000 },
    '3months': { name: '3 Bulan', duration: '90 hari', price: 120000 },
    '1year': { name: '1 Tahun', duration: '365 hari', price: 400000 }
  };

  const paymentMethods = [
    {
      id: 'qris',
      name: 'QRIS',
      description: 'Pay by scanning QR Code',
      icon: QrCodeIcon,
      color: 'bg-blue-500',
      popular: true,
      requiresSelection: false
    },
    {
      id: 'gopay',
      name: 'GoPay',
      description: 'Pay with GoPay',
      icon: DevicePhoneMobileIcon,
      color: 'bg-green-500',
      requiresSelection: false
    },
    {
      id: 'ovo',
      name: 'OVO',
      description: 'Pay with OVO',
      icon: DevicePhoneMobileIcon,
      color: 'bg-purple-500',
      requiresSelection: false
    },
    {
      id: 'dana',
      name: 'DANA',
      description: 'Pay with DANA',
      icon: DevicePhoneMobileIcon,
      color: 'bg-blue-600',
      requiresSelection: false
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: 'Transfer to bank account',
      icon: BanknotesIcon,
      color: 'bg-gray-600',
      requiresSelection: true,
      options: [
        { id: 'bca', name: 'BCA', account: '1234567890' },
        { id: 'mandiri', name: 'Mandiri', account: '0987654321' },
        { id: 'bni', name: 'BNI', account: '1122334455' },
        { id: 'bri', name: 'BRI', account: '5544332211' }
      ]
    },
    {
      id: 'debit_card',
      name: 'Debit Card',
      description: 'Pay with debit card',
      icon: CreditCardIcon,
      color: 'bg-indigo-500',
      requiresSelection: true,
      options: [
        { id: 'visa_debit', name: 'Visa Debit' },
        { id: 'mastercard_debit', name: 'Mastercard Debit' }
      ]
    }
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (!authLoading && !selectedPlan) {
      router.push('/upgrade');
      return;
    }
  }, [user, selectedPlan, authLoading, router]);

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    setSelectedBank(null);
    
    const method = paymentMethods.find(m => m.id === methodId);
    if (method?.requiresSelection) {
      setShowConfirmButton(false);
    } else {
      setShowConfirmButton(true);
    }
  };

  const handleBankSelect = (bankId: string) => {
    setSelectedBank(bankId);
    setShowConfirmButton(true);
  };

  const handleConfirmPayment = () => {
    const methodParam = selectedBank ? `${selectedPaymentMethod}_${selectedBank}` : selectedPaymentMethod;
    router.push(`/payment?plan=${selectedPlan}&method=${methodParam}`);
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !selectedPlan) {
    return null;
  }

  const currentPlan = plans[selectedPlan as keyof typeof plans];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
          <button
          onClick={() => router.push('/upgrade')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-8"
          >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Choose Package
          </button>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Payment Method
          </h1>
          <p className="text-xl text-gray-600">
            Complete payment for {currentPlan?.name} package
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Premium Package</span>
              <span className="font-medium">{currentPlan?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Duration</span>
              <span className="font-medium">{currentPlan?.duration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Price</span>
              <span className="font-medium">Rp {currentPlan?.price.toLocaleString()}</span>
            </div>
            <hr className="my-4" />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="text-indigo-600">Rp {currentPlan?.price.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Methods</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentMethods.map((method) => {
              const IconComponent = method.icon;
              return (
                <div
                  key={method.id}
                  className={`relative bg-white rounded-xl border-2 p-6 cursor-pointer transition-all hover:shadow-lg ${
                    selectedPaymentMethod === method.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handlePaymentMethodSelect(method.id)}
                >
                  {method.popular && (
                    <div className="absolute -top-2 -right-2">
                      <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                        Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center mb-3">
                    <div className={`w-12 h-12 ${method.color} rounded-lg flex items-center justify-center mr-4`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{method.name}</h3>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                  </div>
                  
                  {selectedPaymentMethod === method.id && (
                    <div className="flex items-center text-indigo-600">
                      <CheckIcon className="h-5 w-5 mr-2" />
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bank Selection */}
        {selectedPaymentMethod && paymentMethods.find(m => m.id === selectedPaymentMethod)?.requiresSelection && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {selectedPaymentMethod === 'bank_transfer' ? 'Select Bank' : 'Select Card Type'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.find(m => m.id === selectedPaymentMethod)?.options?.map((option) => (
                <div
                  key={option.id}
                  className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedBank === option.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleBankSelect(option.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{option.name}</h3>
                      {'account' in option && option.account && (
                        <p className="text-sm text-gray-600">Account: {option.account}</p>
                      )}
                    </div>
                    {selectedBank === option.id && (
                      <CheckIcon className="h-5 w-5 text-indigo-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confirm Button */}
        {showConfirmButton && (
          <div className="mb-8 text-center">
            <button
              onClick={handleConfirmPayment}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold text-lg transition-colors"
            >
              Confirm Payment
            </button>
          </div>
        )}

        {/* Payment Info */}
        <div className="bg-blue-50 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Payment Information</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Secure and encrypted payment</li>
            <li>• Premium access activated after successful payment</li>
            <li>• 24/7 support for payment assistance</li>
            <li>• All transactions are protected and secure</li>
          </ul>
        </div>

        {message && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
