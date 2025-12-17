import {} from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { api } from '../lib/api';

export function VerifyEmailSent() {
  const location = useLocation();
  const email = (location.state as any)?.email || 'your email';

  const handleResend = async () => {
    try {
      await api.resendVerification(email);
      alert('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      alert(error.response?.data?.error?.message || 'Failed to resend email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Mail className="h-16 w-16 text-primary-600 mx-auto" />
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Check Your Email</h2>
          <p className="mt-2 text-gray-600">
            We've sent a verification link to <strong>{email}</strong>
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Please click the link in the email to verify your account before logging in.
          </p>
          <div className="mt-6 space-y-4">
            <button
              onClick={handleResend}
              className="btn btn-secondary w-full"
            >
              Resend Verification Email
            </button>
            <Link to="/login" className="btn btn-primary w-full block text-center">
              Go to Login
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Didn't receive the email? Check your spam folder or try resending.
          </p>
        </div>
      </div>
    </div>
  );
}

