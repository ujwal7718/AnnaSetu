import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

/**
 * Shown to NGO users who have verified their email but whose account
 * has not yet been approved (or has been rejected) by an admin.
 *
 * Props:
 *   status  – 'pending' | 'rejected'
 *   note    – optional rejection note from admin
 */
const NGOPendingScreen = ({ status, note }) => {
  const { logout, user } = useAuth();

  const isPending  = status === 'pending'  || !status;
  const isRejected = status === 'rejected';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Coloured top band */}
          <div className={`h-2 w-full ${isPending ? 'bg-amber-400' : 'bg-red-500'}`} />

          <div className="p-10">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Logo size="large" />
            </div>

            {/* Icon */}
            <div className={`mx-auto mb-6 w-20 h-20 rounded-full flex items-center justify-center ${
              isPending ? 'bg-amber-50' : 'bg-red-50'
            }`}>
              {isPending ? (
                // Clock icon
                <svg className="w-10 h-10 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                // X-circle icon
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>

            {/* Heading */}
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
              {isPending ? 'Awaiting Admin Approval' : 'Application Rejected'}
            </h1>

            {/* Sub-text */}
            <p className="text-gray-500 text-center text-sm leading-relaxed mb-6">
              {isPending
                ? `Hi ${user?.name || 'there'}, your NGO account has been created and your email is verified. An admin will review your application and approve your account shortly.`
                : `Hi ${user?.name || 'there'}, unfortunately your NGO account application has been rejected.`
              }
            </p>

            {/* Rejection note */}
            {isRejected && note && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
                <span className="font-semibold">Reason: </span>{note}
              </div>
            )}

            {/* Status steps (pending only) */}
            {isPending && (
              <div className="bg-gray-50 rounded-xl p-5 mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Your progress
                </h3>
                <ol className="space-y-3">
                  {[
                    { label: 'Register account',          done: true  },
                    { label: 'Verify email address',      done: true  },
                    { label: 'Admin review & approval',   done: false },
                    { label: 'Access NGO Dashboard',      done: false },
                  ].map(({ label, done }) => (
                    <li key={label} className="flex items-center gap-3">
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        done
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        {done ? (
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : '•'}
                      </span>
                      <span className={`text-sm ${done ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                        {label}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {isRejected && (
                <Link
                  to="/register"
                  className="w-full py-3 text-center bg-blue-600 text-white rounded-xl font-semibold
                             hover:bg-blue-700 transition-colors"
                >
                  Register a new account
                </Link>
              )}
              <button
                onClick={logout}
                className="w-full py-3 text-center border border-gray-300 text-gray-700 rounded-xl
                           font-semibold hover:bg-gray-50 transition-colors"
              >
                Sign out
              </button>
            </div>

          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Questions? Contact the ANNASETU team for support.
        </p>
      </motion.div>
    </div>
  );
};

export default NGOPendingScreen;
