import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API = process.env.REACT_APP_SERVER_URL || 'http://localhost:5001';

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, y: -16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl max-w-sm text-white text-sm font-medium ${
      type === 'error' ? 'bg-red-600' : 'bg-green-600'
    }`}
  >
    <span className="flex-1">{message}</span>
    <button onClick={onDismiss} className="opacity-70 hover:opacity-100 ml-2">✕</button>
  </motion.div>
);

// ─── ForgotPassword Component ──────────────────────────────────────────────────
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      showToast('Please enter your email address.', 'error');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/forgot-password`, { email: email.trim() });
      setSubmitted(true);
      setEmail('');
      showToast('Password reset link sent! Check your email.', 'success');
    } catch (error) {
      showToast(
        error.response?.data?.message || 'Failed to send reset link. Please try again.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 px-8 py-10 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">🌾 AnnaSetu</h1>
            <p className="text-blue-100">Forgot your password?</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {!submitted ? (
              <>
                <p className="text-gray-600 text-sm mb-6">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    Remember your password?{' '}
                    <a
                      href="/login"
                      className="text-green-600 font-semibold hover:text-green-700 transition-colors"
                    >
                      Back to Login
                    </a>
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✓</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Check your email</h2>
                <p className="text-gray-600 text-sm">
                  We've sent a password reset link to <strong>{email}</strong>. The link expires
                  in 1 hour.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-sm text-green-600 font-semibold hover:text-green-700 transition-colors mt-4"
                >
                  Try another email
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-200">
            <p className="text-xs text-gray-500">
              🔒 Your account is secure. We'll only use this email to send the reset link.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
