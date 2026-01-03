'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

export function SubscriptionStatus() {
  const { profile } = useAuth();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  useEffect(() => {
    if (profile?.membership_type === 'premium' && profile?.subscription_end) {
      const checkTimeLeft = () => {
        const now = new Date().getTime();
        const endTime = new Date(profile.subscription_end).getTime();
        const remaining = Math.max(0, endTime - now);
        
        setTimeLeft(remaining);
        
        // Check if expiring in less than 3 days
        const threeDays = 3 * 24 * 60 * 60 * 1000;
        setIsExpiringSoon(remaining <= threeDays && remaining > 0);
      };

      checkTimeLeft();
      const interval = setInterval(checkTimeLeft, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }
  }, [profile]);

  const formatTimeLeft = (milliseconds: number) => {
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60 * 1000));
    
    if (days > 0) {
      return `${days} hari ${hours} jam`;
    } else if (hours > 0) {
      return `${hours} jam ${minutes} menit`;
    } else {
      return `${minutes} menit`;
    }
  };

  if (profile?.membership_type !== 'premium') {
    return null;
  }

  if (timeLeft === null) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <ClockIcon className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800 font-medium">
            Premium Active
          </span>
        </div>
      </div>
    );
  }

  if (timeLeft === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-red-800 font-medium">
            Subscription Expired - Renew to continue premium access
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 ${
      isExpiringSoon 
        ? 'bg-orange-50 border-orange-200' 
        : 'bg-green-50 border-green-200'
    }`}>
      <div className="flex items-center">
        {isExpiringSoon ? (
          <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mr-2" />
        ) : (
          <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
        )}
        <div>
          <span className={`font-medium ${
            isExpiringSoon ? 'text-orange-800' : 'text-green-800'
          }`}>
            Premium Active
          </span>
          <p className={`text-sm ${
            isExpiringSoon ? 'text-orange-700' : 'text-green-700'
          }`}>
            {isExpiringSoon ? 'Expires in' : 'Time remaining'}: {formatTimeLeft(timeLeft)}
          </p>
        </div>
      </div>
      {isExpiringSoon && (
        <div className="mt-2">
          <a 
            href="/upgrade" 
            className="text-orange-600 hover:text-orange-800 text-sm font-medium underline"
          >
            Renew subscription →
          </a>
        </div>
      )}
    </div>
  );
}
