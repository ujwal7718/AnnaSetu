import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
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

// ─── PasswordStrengthIndicator ────────────────────────────────────────────────
const PasswordStrengthIndicator = ({ password }) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  const passedChecks = Object.values(checks).filter(Boolean).length;
  const strength = passedChecks / 5;

  let strengthColor = 'bg-red-500';
  let strengthText = 'Weak';

  if (strength >= 0.8) {
    strengthColor = 'bg-green-500';
    strengthText = 'Strong';
  } else if (strength >= 0.6) {
    strengthColor = 'bg-yellow-500';
    strengthText = 'Fair';
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">Password Strength</span>
        <span className={`text-xs font-semibold ${
          strength >= 0.8 ? 'text-green-600' : strength >= 0.6 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {strengthText}
        </span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${strengthColor} transition-all duration-300`}
          style={{ width: `${strength * 100}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className={checks.length ? 'text-green-600' : 'text-gray-400'}>
          {checks.length ? '✓' : '○'} 8+ characters
        </div>
        <div className={checks.uppercase ? 'text-green-600' : 'text-gray-400'}>
          {checks.uppercase ? '✓' : '○'} Uppercase letter
        </div>
        <div className={checks.lowercase ? 'text-green-600' : 'text-gray-400'}>
          {checks.lowercase ? '✓' : '○'} Lowercase letter
        </div>
        <div className={checks.number ? 'text-green-600' : 'text-gray-400'}>
          {checks.number ? '✓' : '○'} Number
        </div>
        <div className={checks.special ? 'text-green-600' : 'text-gray-400'}>
          {checks.special ? '✓' : '○'} Special character
        </div>
      </div>
    </div>
  );
};

// ─── ResetPassword Page ────────────────────────────────────────────────────────
const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 4000);
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h2>
          <p className="text-gray-600 text-sm mb-6">
            The reset link is missing or invalid. Please request a new password reset link.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
          >
            Request New Link
          </Link>
        </motion.div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password.trim()) {
      showToast('Please enter a new password.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    // Validate password requirements
    if (password.length < 8) {
      showToast('Password must be at least 8 characters.', 'error');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      showToast('Password must contain at least one uppercase letter.', 'error');
      return;
    }

    if (!/[a-z]/.test(password)) {
      showToast('Password must contain at least one lowercase letter.', 'error');
      return;
    }

    if (!/[0-9]/.test(password)) {
      showToast('Password must contain at least one number.', 'error');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      showToast('Password must contain at least one special character.', 'error');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/api/auth/reset-password`, { token, password });
      setSubmitted(true);
      showToast('Password reset successfully!', 'success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (error) {
      showToast(
        error.response?.data?.message || 'Failed to reset password. Please try again.',
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
            <p className="text-blue-100">Set your new password</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {!submitted ? (
              <>
                <p className="text-gray-600 text-sm mb-6">
                  Enter a strong password for your account. You'll use this to log in.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Password field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors pr-12"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? '👁️‍🗨️' : '👁️'}
                      </button>
                    </div>
                  </div>

                  {/* Password strength indicator */}
                  {password && <PasswordStrengthIndicator password={password} />}

                  {/* Confirm password field */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                      disabled={loading}
                    />
                  </div>

                  {/* Match indicator */}
                  {confirmPassword && (
                    <div className={`text-xs font-medium ${
                      password === confirmPassword ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !password || !confirmPassword}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Resetting...
                      </span>
                    ) : (
                      'Reset Password'
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    Remember your password?{' '}
                    <Link
                      to="/login"
                      className="text-green-600 font-semibold hover:text-green-700 transition-colors"
                    >
                      Back to Login
                    </Link>
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✓</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Password reset successful!</h2>
                <p className="text-gray-600 text-sm">
                  Your password has been changed. You can now log in with your new password.
                </p>
                <p className="text-xs text-gray-400 mt-4">
                  Redirecting to login in a few seconds...
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-4 text-center border-t border-gray-200">
            <p className="text-xs text-gray-500">
              🔒 Your account is secure. We never store passwords in plain text.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
