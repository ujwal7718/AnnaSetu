import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import API_BASE_URL from '../config/api';

// ─── Pure validation helpers (no side-effects) ───────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[6-9]\d{9}$/; // exactly 10 digits, starts with 6-9

const validateEmail = (v) => {
  if (!v) return 'Email is required';
  if (!EMAIL_RE.test(v.trim())) return 'Enter a valid email address (e.g. name@gmail.com)';
  return '';
};

const validatePhone = (v) => {
  const digits = v.replace(/\D/g, '');
  if (!digits) return 'Phone number is required';
  if (digits.length < 10) return `Enter 10 digits — ${10 - digits.length} more needed`;
  if (digits.length > 10) return 'Phone number must be exactly 10 digits';
  if (!PHONE_RE.test(digits)) return 'Must start with 6, 7, 8, or 9 (Indian mobile number)';
  return '';
};

const validateName = (v) => {
  if (!v || !v.trim()) return 'Full name is required';
  if (v.trim().length < 2) return 'Name must be at least 2 characters';
  return '';
};

const validateAddress = (v) => {
  if (!v || !v.trim()) return 'Address is required';
  if (v.trim().length < 5) return 'Address is too short';
  return '';
};

const passwordChecks = (v) => ({
  length:    v.length >= 8,
  uppercase: /[A-Z]/.test(v),
  lowercase: /[a-z]/.test(v),
  number:    /[0-9]/.test(v),
  special:   /[^A-Za-z0-9]/.test(v),
});

const validatePassword = (v) => {
  if (!v) return 'Password is required';
  const c = passwordChecks(v);
  if (!c.length)    return 'Password must be at least 8 characters';
  if (!c.uppercase) return 'Add at least one uppercase letter';
  if (!c.lowercase) return 'Add at least one lowercase letter';
  if (!c.number)    return 'Add at least one number';
  if (!c.special)   return 'Add at least one special character (!@#$%...)';
  return '';
};

const isPasswordValid = (v) => Object.values(passwordChecks(v)).every(Boolean);

// ─── Small reusable components ────────────────────────────────────────────────

const FieldError = ({ message }) =>
  message ? (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="mt-2 text-xs text-red-600 flex items-center gap-1"
    >
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {message}
    </motion.p>
  ) : null;

const FieldSuccess = ({ show }) =>
  show ? (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute inset-y-0 right-3 flex items-center pointer-events-none"
    >
      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    </motion.span>
  ) : null;

const inputClass = (error, touched, valid) => {
  const base = 'w-full pl-12 pr-10 py-4 border rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2';
  if (!touched) return `${base} border-gray-300 focus:ring-blue-500 focus:border-blue-500`;
  if (error)    return `${base} border-red-400 bg-red-50 focus:ring-red-400 focus:border-red-400`;
  if (valid)    return `${base} border-green-400 bg-green-50 focus:ring-green-400 focus:border-green-400`;
  return `${base} border-gray-300 focus:ring-blue-500 focus:border-blue-500`;
};

// ─── Main component ───────────────────────────────────────────────────────────

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'donor',
    address: '',
    location: { lat: '', lng: '' },
    useManualLocation: false,
    ngoId: '', // NGO selection for volunteers
  });

  // Which fields the user has interacted with
  const [touched, setTouched] = useState({});

  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const passwordRef = useRef(null);
  const { register } = useAuth();
  const navigate     = useNavigate();

  // State for NGO list (for volunteer registration)
  const [ngos, setNgos] = useState([]);
  const [ngosLoading, setNgosLoading] = useState(false);

  const totalSteps = 4;

  // ── Derived validation state ────────────────────────────────────────────────

  const fieldErrors = useMemo(() => ({
    name:     validateName(formData.name),
    email:    validateEmail(formData.email),
    phone:    validatePhone(formData.phone),
    password: validatePassword(formData.password),
    address:  validateAddress(formData.address),
  }), [formData.name, formData.email, formData.phone, formData.password, formData.address]);

  const pwdChecks = useMemo(() => passwordChecks(formData.password), [formData.password]);

  // Step is valid only when ALL required fields in it pass validation
  const stepValid = useMemo(() => ({
    1: !fieldErrors.name && !fieldErrors.phone && formData.role,
    2: !fieldErrors.email && !fieldErrors.password,
    3: !fieldErrors.address &&
       (formData.location.lat && formData.location.lng
         ? true
         : formData.role !== 'volunteer'),  // location required only for volunteer
    4: formData.role !== 'volunteer' || formData.ngoId, // NGO selection required for volunteer
  }), [fieldErrors, formData.role, formData.location, formData.ngoId]);

  // ── Fetch approved NGOs when volunteer role is selected ─────────────────────
  useEffect(() => {
    if (formData.role === 'volunteer' && ngos.length === 0) {
      setNgosLoading(true);
      fetch(`${API_BASE_URL}/api/auth/approved-ngos`)
        .then(res => res.json())
        .then(data => {
          setNgos(data);
          setNgosLoading(false);
        })
        .catch(err => {
          console.error('Failed to load NGOs:', err);
          setNgosLoading(false);
        });
    }
  }, [formData.role, ngos.length]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const markTouched = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const onChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Phone: strip non-digits, cap at 10
  const onPhoneChange = useCallback((e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, phone: digits }));
    setTouched(prev => ({ ...prev, phone: true }));
  }, []);

  const handleRoleChange = useCallback((roleValue) => {
    setFormData(prev => ({ ...prev, role: roleValue }));
  }, []);

  const handleManualLocationChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      location: { ...prev.location, [field]: value },
    }));
  }, []);

  const getLocation = useCallback(() => {
    setError('');
    setLocationLoading(true);
    if (!navigator.geolocation) {
      setError('Geolocation not supported. Enter manually.');
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData(prev => ({
          ...prev,
          location: {
            lat: pos.coords.latitude.toString(),
            lng: pos.coords.longitude.toString(),
          },
          useManualLocation: false,
        }));
        setLocationLoading(false);
      },
      (err) => {
        setLocationLoading(false);
        const msgs = {
          1: 'Location access denied. Enable it in browser settings or enter manually.',
          2: 'Location unavailable. Please enter manually.',
          3: 'Location request timed out. Please try again.',
        };
        setError(msgs[err.code] || 'Unable to get location. Enter manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Block navigation if current step is invalid — also mark all fields touched
  // so errors are revealed on attempted Next
  const nextStep = useCallback(() => {
    if (currentStep === 1) {
      setTouched(prev => ({ ...prev, name: true, phone: true }));
      if (!stepValid[1]) return;
    }
    if (currentStep === 2) {
      setTouched(prev => ({ ...prev, email: true, password: true }));
      if (!stepValid[2]) return;
    }
    if (currentStep === 3) {
      setTouched(prev => ({ ...prev, address: true }));
      if (!stepValid[3]) return;
    }
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  }, [currentStep, stepValid, totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  const onSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Final frontend guard
    if (!stepValid[1] || !stepValid[2] || !stepValid[3]) {
      setError('Please complete all required fields correctly before submitting.');
      return;
    }

    setLoading(true);
    try {
      const submissionData = {
        ...formData,
        location:
          formData.location.lat && formData.location.lng
            ? {
                lat: parseFloat(formData.location.lat),
                lng: parseFloat(formData.location.lng),
              }
            : null,
      };

      const response = await register(submissionData);

      if (response && response.requiresVerification) {
        setSuccess(
          '✅ Account created! Check your email and click the verification link before logging in.'
        );
        return;
      }

      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => {
        navigate(formData.role === 'volunteer' ? '/volunteer' : '/donor');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [formData, register, navigate, stepValid]);

  // ── Role options ──────────────────────────────────────────────────────────

  const roleOptions = useMemo(() => [
    { value: 'donor',     icon: '🍱', title: 'Food Donor',  description: 'I have surplus food to donate' },
    { value: 'volunteer', icon: '🚚', title: 'Volunteer',   description: 'I want to help pick up and deliver food' },
    { value: 'ngo',       icon: '🏢', title: 'NGO',         description: 'We distribute food to those in need' },
  ], []);

  // ── Step indicator ────────────────────────────────────────────────────────

  const StepIndicator = (
    <div className="flex items-center justify-center mb-10">
      <div className="flex items-center space-x-3">
        {Array.from({ length: totalSteps }, (_, i) => (
          <React.Fragment key={i}>
            <div
              className={`relative w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                i + 1 < currentStep
                  ? 'bg-blue-600 text-white shadow-sm'
                  : i + 1 === currentStep
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-md'
                  : 'bg-gray-100 text-gray-400 border border-gray-200'
              }`}
            >
              {i + 1 < currentStep ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            {i < totalSteps - 1 && (
              <div className={`w-12 h-0.5 transition-all duration-500 ${i + 1 < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  // ── Per-step content ──────────────────────────────────────────────────────

  const renderStep1 = () => (
    <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.25 }} className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Tell us about yourself</h3>
        <p className="text-sm text-gray-500">Choose your role and provide basic information</p>
      </div>

      {/* Role selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-4">I want to join as:</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {roleOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleRoleChange(opt.value)}
              className={`relative rounded-2xl p-5 border-2 text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                formData.role === opt.value
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div className="text-3xl mb-2">{opt.icon}</div>
              <div className="font-bold text-gray-900 text-sm mb-1">{opt.title}</div>
              <div className="text-xs text-gray-500 leading-snug">{opt.description}</div>
              {formData.role === opt.value && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* NGO Selection for Volunteers */}
      {formData.role === 'volunteer' && (
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Select Your NGO <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              </svg>
            </div>
            <select
              name="ngoId"
              value={formData.ngoId}
              onChange={onChange}
              onBlur={() => markTouched('ngoId')}
              disabled={ngosLoading}
              className={`w-full pl-12 pr-10 py-4 border rounded-xl transition-all duration-200 text-gray-900 focus:outline-none focus:ring-2 ${
                !formData.ngoId && touched.ngoId
                  ? 'border-red-400 bg-red-50 focus:ring-red-400 focus:border-red-400'
                  : formData.ngoId
                  ? 'border-green-400 bg-green-50 focus:ring-green-400 focus:border-green-400'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              } disabled:opacity-50`}
            >
              <option value="">
                {ngosLoading ? 'Loading NGOs...' : '-- Select an NGO --'}
              </option>
              {ngos.map((ngo) => (
                <option key={ngo._id} value={ngo._id}>
                  {ngo.name}
                </option>
              ))}
            </select>
          </div>
          {!formData.ngoId && touched.ngoId && (
            <FieldError message="NGO selection is required" />
          )}
        </div>
      )}

      {/* Full Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Full Name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={onChange}
            onBlur={() => markTouched('name')}
            placeholder="Enter your full name"
            className={inputClass(touched.name && fieldErrors.name, touched.name, touched.name && !fieldErrors.name && formData.name)}
          />
          <FieldSuccess show={touched.name && !fieldErrors.name && !!formData.name} />
        </div>
        <AnimatePresence>
          {touched.name && <FieldError message={fieldErrors.name} />}
        </AnimatePresence>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Phone Number <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={onPhoneChange}
            onBlur={() => markTouched('phone')}
            placeholder="10-digit mobile number (e.g. 9876543210)"
            maxLength={10}
            inputMode="numeric"
            className={inputClass(touched.phone && fieldErrors.phone, touched.phone, touched.phone && !fieldErrors.phone && formData.phone)}
          />
          {/* Live digit counter */}
          <span className={`absolute inset-y-0 right-3 flex items-center text-xs font-medium pointer-events-none ${
            formData.phone.length === 10 ? 'text-green-500' : 'text-gray-400'
          }`}>
            {formData.phone.length}/10
          </span>
        </div>
        <AnimatePresence>
          {touched.phone && <FieldError message={fieldErrors.phone} />}
        </AnimatePresence>
        <p className="mt-1 text-xs text-gray-400">Indian mobile number · must start with 6, 7, 8, or 9</p>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.25 }} className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Create your account</h3>
        <p className="text-sm text-gray-500">Set up your email and password</p>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Email Address <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
            </svg>
          </div>
          <input
            type="text"
            name="email"
            value={formData.email}
            onChange={(e) => {
              onChange(e);
              // Show error immediately while typing after first char
              if (formData.email.length > 0) markTouched('email');
            }}
            onBlur={() => markTouched('email')}
            placeholder="name@example.com"
            autoComplete="email"
            className={inputClass(touched.email && fieldErrors.email, touched.email, touched.email && !fieldErrors.email && formData.email)}
          />
          <FieldSuccess show={touched.email && !fieldErrors.email && !!formData.email} />
        </div>
        <AnimatePresence>
          {touched.email && <FieldError message={fieldErrors.email} />}
        </AnimatePresence>
        {touched.email && !fieldErrors.email && formData.email && (
          <p className="mt-1 text-xs text-green-600">✓ Valid email format</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <input
            ref={passwordRef}
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={(e) => {
              onChange(e);
              markTouched('password');
            }}
            onBlur={() => markTouched('password')}
            placeholder="Create a strong password"
            className={`${inputClass(touched.password && fieldErrors.password, touched.password, touched.password && isPasswordValid(formData.password))} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(p => !p)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Live password checklist — shown as soon as user starts typing */}
        {formData.password.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl"
          >
            <p className="text-xs font-semibold text-gray-600 mb-2">Password requirements:</p>
            <div className="grid grid-cols-1 gap-1.5">
              {[
                { key: 'length',    label: 'At least 8 characters' },
                { key: 'uppercase', label: 'One uppercase letter (A-Z)' },
                { key: 'lowercase', label: 'One lowercase letter (a-z)' },
                { key: 'number',    label: 'One number (0-9)' },
                { key: 'special',   label: 'One special character (!@#$%...)' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${pwdChecks[key] ? 'bg-green-500' : 'bg-gray-300'}`}>
                    {pwdChecks[key] ? (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </span>
                  <span className={`text-xs ${pwdChecks[key] ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.25 }} className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Where are you located?</h3>
        <p className="text-sm text-gray-500">This helps us match you with nearby donations</p>
        {formData.role === 'volunteer' && (
          <p className="text-xs text-orange-600 mt-1 font-medium">* GPS coordinates required for volunteers</p>
        )}
      </div>

      {/* Location toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-lg p-1 flex gap-1">
          {[
            { value: false, label: '📍 Auto-detect' },
            { value: true,  label: '✏️ Manual entry' },
          ].map(({ value, label }) => (
            <button
              key={String(value)}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, useManualLocation: value, location: { lat: '', lng: '' } }))}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                formData.useManualLocation === value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!formData.useManualLocation ? (
        <div className="text-center space-y-4">
          <button
            type="button"
            onClick={getLocation}
            disabled={locationLoading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto transition-all"
          >
            {locationLoading ? (
              <>
                <svg className="animate-spin mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Getting location...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Get my current location
              </>
            )}
          </button>
          {formData.location.lat && formData.location.lng && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
              ✅ Location captured: {parseFloat(formData.location.lat).toFixed(5)}, {parseFloat(formData.location.lng).toFixed(5)}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {[
            { field: 'lat', label: 'Latitude',  placeholder: 'e.g. 18.5645' },
            { field: 'lng', label: 'Longitude', placeholder: 'e.g. 73.9459' },
          ].map(({ field, label, placeholder }) => (
            <div key={field}>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                {label} {formData.role === 'volunteer' && <span className="text-red-500">*</span>}
              </label>
              <input
                type="number"
                step="any"
                placeholder={placeholder}
                value={formData.location[field]}
                onChange={(e) => handleManualLocationChange(field, e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all"
              />
            </div>
          ))}
        </div>
      )}

      {/* Address */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Address <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute top-4 left-4 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <textarea
            name="address"
            value={formData.address}
            onChange={onChange}
            onBlur={() => markTouched('address')}
            placeholder="Enter your pickup/delivery address"
            rows={3}
            className={`w-full pl-12 pr-4 py-4 border rounded-xl transition-all duration-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 resize-none ${
              touched.address && fieldErrors.address
                ? 'border-red-400 bg-red-50 focus:ring-red-400'
                : touched.address && !fieldErrors.address
                ? 'border-green-400 bg-green-50 focus:ring-green-400'
                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
        </div>
        <AnimatePresence>
          {touched.address && <FieldError message={fieldErrors.address} />}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div key="step4" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.25 }} className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-1">Review your information</h3>
        <p className="text-sm text-gray-500">Confirm everything looks correct before creating your account</p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-xl divide-y divide-gray-200">
        {[
          { label: 'Role',     value: roleOptions.find(r => r.value === formData.role)?.title },
          { label: 'Name',     value: formData.name },
          { label: 'Phone',    value: formData.phone },
          { label: 'Email',    value: formData.email },
          { label: 'Password', value: '•'.repeat(formData.password.length) },
          { label: 'Address',  value: formData.address },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-start justify-between px-4 py-3">
            <span className="text-sm text-gray-500 flex-shrink-0 w-24">{label}</span>
            <span className="text-sm font-medium text-gray-900 text-right break-all">{value}</span>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-0.5">Email verification required</p>
          <p>After clicking "Create Account", a verification email will be sent to <strong>{formData.email}</strong>. You must click the link in that email before you can log in.</p>
        </div>
      </div>
    </motion.div>
  );

  const stepContent = { 1: renderStep1, 2: renderStep2, 3: renderStep3, 4: renderStep4 };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center mb-5">
              <Logo size="large" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
            <p className="text-sm text-gray-500">Join ANNASETU in 4 simple steps</p>
          </div>

          {/* Success banner (replaces the whole form on success) */}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 bg-green-50 border border-green-200 rounded-2xl text-center"
            >
              <div className="text-4xl mb-3">📧</div>
              <h3 className="text-lg font-bold text-green-800 mb-2">Check your email!</h3>
              <p className="text-sm text-green-700 leading-relaxed">{success}</p>
              <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline">
                Go to Login →
              </Link>
            </motion.div>
          )}

          {!success && (
            <>
              {/* Global error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-3 text-sm"
                >
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </motion.div>
              )}

              {StepIndicator}

              <form
                onSubmit={currentStep === 4 ? onSubmit : (e) => { e.preventDefault(); nextStep(); }}
                noValidate
              >
                <AnimatePresence mode="wait">
                  {stepContent[currentStep]()}
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex items-center gap-1 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Back
                    </button>
                  ) : (
                    <div />
                  )}

                  {currentStep < 4 ? (
                    <button
                      type="submit"
                      className={`flex items-center gap-2 px-7 py-3 text-sm font-bold rounded-xl transition-all duration-200 ${
                        stepValid[currentStep]
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Next
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 ml-4 py-4 text-sm font-bold bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Creating Account...
                        </span>
                      ) : (
                        '🚀 Create Account'
                      )}
                    </button>
                  )}
                </div>
              </form>

              <div className="mt-8 text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
                  Sign in
                </Link>
              </div>
            </>
          )}

        </div>
      </motion.div>
    </div>
  );
};

export default Register;
