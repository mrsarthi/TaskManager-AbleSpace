import { useEffect, useState, useRef } from 'react'; // Import useRef
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { CheckCircle, XCircle } from 'lucide-react';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  // Ref to track if we already tried verifying (prevents double-fire)
  const verificationAttempted = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    
    // Prevent running if no token or if already attempted
    if (!token || verificationAttempted.current) {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
      }
      return;
    }

    verificationAttempted.current = true;

    const verifyEmail = async () => {
      try {
        const response = await api.verifyEmail(token);
        if (response.success) {
          setStatus('success');
          setMessage('Email verified successfully! You can now log in.');
          localStorage.removeItem('user');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.error?.message || 'Failed to verify email.';
        
        // Check for "already verified" BEFORE setting error state
        if (errorMsg.toLowerCase().includes('already verified')) {
          setStatus('success');
          setMessage('Email is already verified! You can log in now.');
          localStorage.removeItem('user');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          // Only set error if it's genuinely NOT verified
          setStatus('error');
          setMessage(errorMsg);
        }
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">Verifying your email...</h2>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="mt-6 text-2xl font-bold text-gray-900">Email Verified!</h2>
              <p className="mt-2 text-gray-600">{message}</p>
              <p className="mt-4 text-sm text-gray-500">Redirecting to login...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <h2 className="mt-6 text-2xl font-bold text-gray-900">Verification Failed</h2>
              <p className="mt-2 text-gray-600">{message}</p>
              <div className="mt-6 space-y-4">
                <Link to="/login" className="btn btn-primary block text-center">
                  Go to Login
                </Link>
                <Link to="/resend-verification" className="btn btn-secondary block text-center">
                  Resend Verification Email
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}