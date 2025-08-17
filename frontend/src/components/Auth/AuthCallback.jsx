
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleAuthCallback } = useAuth();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get URL parameters
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`Authentication failed: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        setStatus('exchanging');

        // Exchange code for token via backend
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/callback?code=${code}&state=${state}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Authentication failed');
        }

        if (!data.success) {
          throw new Error(data.message || 'Authentication was not successful');
        }

        // Handle successful authentication
        const success = await handleAuthCallback(data.token, data.user);
        
        if (success) {
          setStatus('success');
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
        } else {
          throw new Error('Failed to complete authentication');
        }

      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err.message);
        setStatus('error');
        
        // Redirect to login after error delay
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 5000);
      }
    };

    processCallback();
  }, [searchParams, handleAuthCallback, navigate]);

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Processing authentication...</h3>
            <p className="mt-2 text-sm text-gray-600">Please wait while we set up your account.</p>
          </div>
        );

      case 'exchanging':
        return (
          <div className="text-center">
            <div className="animate-pulse">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mx-auto">
                <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Connecting your YouTube account...</h3>
            <p className="mt-2 text-sm text-gray-600">Setting up your dashboard access.</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mx-auto">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Authentication successful!</h3>
            <p className="mt-2 text-sm text-gray-600">Redirecting to your dashboard...</p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mx-auto">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Authentication failed</h3>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <p className="mt-2 text-xs text-gray-500">Redirecting to login page...</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default AuthCallback;
