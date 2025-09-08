import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement forgot password logic
    console.log('Forgot password request for:', email);
    setIsSubmitted(true);
  };

  return (
    <>
      <Head>
        <title>Forgot Password - Verifly</title>
        <meta name="description" content="Reset your Verifly password" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <Link href="/" className="flex justify-center">
              <span className="text-3xl font-bold text-primary-600">Verifly</span>
            </Link>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Reset your password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{' '}
              <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                return to sign in
              </Link>
            </p>
          </div>

          {!isSubmitted ? (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="form-label">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="form-input"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="mt-2 text-sm text-gray-500">
                  We'll send you a link to reset your password.
                </p>
              </div>

              <div>
                <button type="submit" className="btn btn-primary w-full text-base">
                  Send reset link
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-8 text-center">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Reset link sent!
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>We've sent a password reset link to <strong>{email}</strong>. Please check your email and follow the instructions to reset your password.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-sm text-gray-600">
                  Didn't receive the email? Check your spam folder or{' '}
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    try again
                  </button>
                </p>
              </div>

              <div className="mt-4">
                <Link href="/login" className="btn btn-secondary w-full text-base">
                  Back to sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}