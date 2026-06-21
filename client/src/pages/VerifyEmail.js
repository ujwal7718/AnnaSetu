import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = process.env.REACT_APP_SERVER_URL || 'http://localhost:5001';

// Verification can be in one of four states:
//   'loading'  – API call in flight
//   'success'  – isEmailVerified set to true in DB
//   'error'    – token invalid, expired, already used, or server error
//   'no-token' – URL has no ?token= param at all
const STATUS = {
  LOADING:  'loading',
  SUCCESS:  'success',
  ERROR:    'error',
  NO_TOKEN: 'no-token',
};

// ─── VerifyEmail page ─────────────────────────────────────────────────────────

/**
 * Renders at /verify-email?token=<rawToken>
 *
 * Flow:
 *  1. Extract token from URL search params.
 *  2. POST to GET /api/auth/verify-email?token=<token> on mount (once).
 *  3. Show loading → success or error state.
 *  4. On success, auto-redirect to /login after 4 seconds.
 *
 * Why this page exists:
 *  The verification email contains a link pointing to this React route.
 *  Without this page, React Router falls through to the catch-all "*" route
 *  and redirects to "/", meaning the backend API is never called and
 *  isEmailVerified is never set to true in MongoDB.
 */
const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus]   = useState(STATUS.LOADING);
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(4);

  // Prevent double-firing in React 18 StrictMode (dev) where useEffect
  // runs twice on mount. The ref acts as a one-shot flag.
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const token = searchParams.get('token');

    // Guard: no token in URL
    if (!token) {
      setStatus(STATUS.NO_TOKEN);
      return;
    }

    const verify = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/auth/verify-email`,
          { params: { token } }
        );
        setMessage(res.data.message || 'Email verified successfully!');
        setStatus(STATUS.SUCCESS);
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          'Something went wrong. Please try again or request a new verification link.';
        setMessage(msg);
        setStatus(STATUS.ERROR);
      }
    };

    verify();
  }, [searchParams]);

  // Countdown timer → auto-redirect to /login on success
  useEffect(() => {
    if (status !== STATUS.SUCCESS) return;
    if (countdown <= 0) {
      window.location.href = '/login';
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [status, countdown]);

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderLoading = () => (
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">Verifying your email…</h2>
      <p className="text-gray-500 text-sm">Please wait while we confirm your account.</p>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center">
      {/* Animated checkmark */}
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-3">Email verified!</h2>
      <p className="text-gray-600 mb-2">{message}</p>
      <p className="text-sm text-gray-400 mb-8">
        Redirecting to login in{' '}
        <span className="font-semibold text-blue-600">{countdown}</span> second
        {countdown !== 1 ? 's' : ''}…
      </p>

      <Link
        to="/login"
        className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-600
                   text-white font-semibold rounded-xl shadow-md hover:shadow-lg
                   transition-all duration-200 hover:from-blue-700 hover:to-teal-700"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
        </svg>
        Go to Login now
      </Link>
    </div>
  );

  const renderError = () => (
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-3">Verification failed</h2>
      <p className="text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">{message}</p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <ResendButton />
        <Link
          to="/register"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300
                     text-gray-700 font-semibold rounded-xl hover:border-gray-400 hover:bg-gray-50
                     transition-all duration-200"
        >
          Register again
        </Link>
      </div>
    </div>
  );

  const renderNoToken = () => (
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-yellow-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-3">Invalid link</h2>
      <p className="text-gray-600 mb-8 max-w-sm mx-auto">
        This verification link is missing its token. Please use the exact link
        from your verification email, or request a new one below.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <ResendButton />
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300
                     text-gray-700 font-semibold rounded-xl hover:border-gray-400 hover:bg-gray-50
                     transition-all duration-200"
        >
          Go home
        </Link>
      </div>
    </div>
  );

  // ── Layout ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Logo / brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-green-600 rounded-2xl shadow-lg mb-4">
            <span className="text-2xl">🌾</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">ANNASETU</h1>
          <p className="text-sm text-gray-500">Email Verification</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10">
          {status === STATUS.LOADING  && renderLoading()}
          {status === STATUS.SUCCESS  && renderSuccess()}
          {status === STATUS.ERROR    && renderError()}
          {status === STATUS.NO_TOKEN && renderNoToken()}
        </div>

      </div>
    </div>
  );
};

// ─── ResendButton — inline sub-component ─────────────────────────────────────
// Lets users request a fresh verification email without leaving the page.

const ResendButton = () => {
  const [email, setEmail]     = useState('');
  const [open, setOpen]       = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [resendError, setResendError] = useState('');

  const handleResend = async () => {
    if (!email.trim()) {
      setResendError('Please enter your email address.');
      return;
    }
    setSending(true);
    setResendError('');
    try {
      await axios.post(`${API_BASE}/api/auth/resend-verification`, { email: email.trim() });
      setSent(true);
    } catch {
      setResendError('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 px-6 py-3
                   bg-blue-600 text-white font-semibold rounded-xl shadow-md
                   hover:bg-blue-700 transition-all duration-200"
      >
        Resend verification email
      </button>
    );
  }

  if (sent) {
    return (
      <div className="text-center text-sm text-green-700 font-medium px-4 py-3 bg-green-50 rounded-xl border border-green-200">
        ✅ If that email has an unverified account, a new link has been sent.
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Enter your email address"
        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        onKeyDown={e => e.key === 'Enter' && handleResend()}
      />
      {resendError && <p className="text-xs text-red-600">{resendError}</p>}
      <button
        onClick={handleResend}
        disabled={sending}
        className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl
                   hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {sending ? 'Sending…' : 'Send new link'}
      </button>
    </div>
  );
};

export default VerifyEmail;
