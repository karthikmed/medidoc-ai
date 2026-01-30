'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '../actions/login';

/**
 * Login Page Component
 * Split layout: MediDoc branding on left, login form on right
 */
export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const result = await loginAction(formData);

    setIsLoading(false);
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      // Redirect to the dummy dashboard after successful login
      router.push('/dashboard');
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Side: Branding */}
      <div className="hidden md:flex md:w-1/2 bg-indigo-600 items-center justify-center p-12 text-white">
        <div className="max-w-md text-center">
          <h1 className="text-5xl font-extrabold mb-6 tracking-tight">MediDoc</h1>
          <p className="text-xl text-indigo-100 leading-relaxed">
            Advanced AI-powered healthcare documentation and management system.
          </p>
          <div className="mt-10 flex justify-center">
            <div className="h-1 w-20 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-gray-50 md:bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="md:hidden text-center mb-8">
            <h1 className="text-4xl font-bold text-indigo-600">MediDoc</h1>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Sign in
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please enter your credentials to access your account
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter your username"
                />
              </div>
              <div>
                <label htmlFor="password" title="Password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {message && (
              <div
                className={`p-4 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-1 ${
                  message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.98]"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign in'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              &copy; 2026 MediDoc AI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
