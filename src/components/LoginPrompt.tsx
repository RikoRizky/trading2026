import Link from 'next/link';
import { BookOpenIcon } from '@heroicons/react/24/outline';

interface LoginPromptProps {
  isAuthenticated: boolean;
  isPremiumUser?: boolean;
  className?: string;
  showIcon?: boolean;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonHref?: string;
}

export default function LoginPrompt({
  isAuthenticated,
  isPremiumUser = false,
  className = "",
  showIcon = true,
  title,
  description,
  buttonText,
  buttonHref
}: LoginPromptProps) {
  const defaultTitle = !isAuthenticated ? "Login Required" : "Premium Content";
  const defaultDescription = !isAuthenticated 
    ? "Please login to watch this video" 
    : "Upgrade to Premium to watch this video";
  const defaultButtonText = !isAuthenticated ? "Login" : "Upgrade Now";
  const defaultButtonHref = !isAuthenticated ? "/login" : "/upgrade";

  return (
    <div className={`absolute inset-0 bg-black/60 flex items-center justify-center ${className}`}>
      <div className="text-center text-white p-6">
        {showIcon && (
          <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpenIcon className="h-8 w-8 text-white" />
          </div>
        )}
        <h3 className="text-xl font-bold mb-2">
          {title || defaultTitle}
        </h3>
        <p className="text-sm mb-4 opacity-90">
          {description || defaultDescription}
        </p>
        <Link href={buttonHref || defaultButtonHref} className="btn btn-primary btn-sm">
          {buttonText || defaultButtonText}
        </Link>
      </div>
    </div>
  );
}

