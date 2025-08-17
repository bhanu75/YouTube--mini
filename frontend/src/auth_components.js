// ============================================
// FILE: frontend/src/components/Auth/LoginButton.jsx
// ============================================

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

function LoginButton() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await login();
    } catch (err) {
      setError('Failed to initiate login. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Connecting to Google...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </>
        )}
      </button>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 text-center">
        By signing in, you agree to connect your YouTube account for managing videos, comments, and notes.
      </div>
    </div>
  );
}

export default LoginButton;

// ============================================
// FILE: frontend/src/components/Auth/AuthCallback.jsx
// ============================================

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