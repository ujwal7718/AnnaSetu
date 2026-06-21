import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import PremiumButton from './PremiumButton';
import PremiumInput from './PremiumInput';
import PremiumCard from './PremiumCard';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { email, password, rememberMe } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = await login(formData);
      
      // Get user role from response
      const userRole = response?.user?.role;
      
      // Redirect based on user role immediately
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'volunteer') {
        navigate('/volunteer');
      } else if (userRole === 'ngo') {
        navigate('/ngo');
      } else {
        navigate('/donor');
      }
    } catch (err) {
      const data = err.response?.data;
      // If the server says the account is unverified, surface a resend link
      // instead of a generic error message.
      if (data?.requiresVerification) {
        setNeedsVerification(true);
      }
      setError(data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Enhanced Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-green-600">
          {/* Floating Animated Shapes */}
          <div className="absolute inset-0">
            <motion.div
              animate={{
                y: [0, -30, 0],
                x: [0, 20, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-2xl"
            />
            <motion.div
              animate={{
                y: [0, 30, 0],
                x: [0, -15, 0],
                scale: [1, 0.9, 1],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
              className="absolute top-40 right-20 w-48 h-48 bg-white/8 rounded-full blur-xl"
            />
            <motion.div
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 4
              }}
              className="absolute bottom-32 left-32 w-32 h-32 bg-white/12 rounded-full blur-lg"
            />
            <motion.div
              animate={{
                y: [0, 25, 0],
                x: [0, -20, 0],
                scale: [1, 0.8, 1],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
              className="absolute bottom-20 right-32 w-40 h-40 bg-white/6 rounded-full blur-xl"
            />
          </div>
          
          {/* Glass Overlay */}
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
        </div>
        
        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex flex-col justify-center items-center p-12 text-white"
        >
          {/* Logo Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-12"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <Logo size="xlarge" className="bg-transparent" />
              </div>
            </div>
          </motion.div>
          
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-center max-w-md"
          >
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Welcome to
              <span className="block text-6xl font-black bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                ANNASETU
              </span>
            </h1>
            <p className="text-xl text-blue-100 mb-12 leading-relaxed">
              Connecting surplus food with those in need. 
              <span className="block mt-2 font-semibold">Together, we make a difference.</span>
            </p>
            
            {/* Features */}
            <div className="space-y-4 text-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex items-center space-x-4 group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <span className="text-lg group-hover:text-white transition-colors">Reduce food waste</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex items-center space-x-4 group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </motion.div>
                <span className="text-lg group-hover:text-white transition-colors">Help communities in need</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="flex items-center space-x-4 group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </motion.div>
                <span className="text-lg group-hover:text-white transition-colors">Make meaningful impact</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Right Side - Enhanced Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50">
          <div className="absolute top-10 right-10 w-32 h-32 bg-blue-200/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-green-200/20 rounded-full blur-xl"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <Logo size="xlarge" />
              <h1 className="text-2xl font-bold text-gray-900 mt-4">ANNASETU</h1>
              <p className="text-gray-600">Food Donation Platform</p>
            </motion.div>
          </div>
          
          {/* Glassmorphism Login Card */}
          <PremiumCard variant="glass" className="w-full backdrop-blur-xl bg-white/90 border border-white/20">
            <div className="text-center mb-8">
              <motion.h2 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-3xl font-bold text-gray-900 mb-2"
              >
                Welcome Back
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="text-gray-600"
              >
                Sign in to your account to continue making a difference
              </motion.p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6"
              >
                <div className="p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl text-red-700">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                  {/* If login was blocked due to unverified email, offer a shortcut
                      to the verify-email page so the user can resend the link. */}
                  {needsVerification && (
                    <div className="mt-2 pt-2 border-t border-red-200/60 text-xs text-red-600">
                      Didn't receive the email?{' '}
                      <Link
                        to="/verify-email"
                        className="font-semibold underline hover:text-red-800 transition-colors"
                      >
                        Resend verification link
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            
            <form onSubmit={onSubmit} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <PremiumInput
                  label="Email Address"
                  type="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  placeholder="Enter your email"
                  required
                  icon={
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  }
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                <PremiumInput
                  label="Password"
                  type="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  placeholder="Enter your password"
                  required
                  showPasswordToggle={true}
                  icon={
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="flex items-center justify-between"
              >
                <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={rememberMe}
                    onChange={onChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  />
                  <span className="group-hover:text-gray-800 transition-colors">Remember me</span>
                </label>
                
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-all duration-200 hover:underline"
                >
                  Forgot password?
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.4 }}
              >
                <PremiumButton
                  type="submit"
                  loading={loading}
                  className="w-full py-4 text-lg font-semibold shadow-lg hover:shadow-xl"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </PremiumButton>
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.6 }}
              className="mt-8"
            >
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/90 backdrop-blur-sm text-gray-500">New to ANNASETU?</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Link 
                  to="/register" 
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-all duration-200 group"
                >
                  <svg className="w-4 h-4 mr-1 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="group-hover:underline">Create an account</span>
                </Link>
              </div>
            </motion.div>
          </PremiumCard>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
