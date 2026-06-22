import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const API_BASE = API_BASE_URL;

/**
 * ProfileEdit
 *
 * A reusable modal/form for editing user profile across all roles.
 *
 * Props:
 *   isOpen: boolean              - Whether modal is visible
 *   user: object                 - Current user data
 *   onClose: function            - Called when modal closes
 *   onSuccess: function(newUser) - Called after successful update
 */
const ProfileEdit = ({ isOpen, user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    location: { lat: '', lng: '' }
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Initialize form with current user data ──────────────────────────────────
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.location?.address || '',
        location: {
          lat: user.location?.coordinates?.[1] || '',
          lng: user.location?.coordinates?.[0] || ''
        }
      });
      setError('');
      setSuccess('');
    }
  }, [user, isOpen]);

  // ── Handle field changes ────────────────────────────────────────────────────
  const onChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('location.')) {
      const locField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, [locField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // ── Get current location ────────────────────────────────────────────────────
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }));
        setError('');
      },
      (err) => {
        setError('Could not get location: ' + err.message);
      }
    );
  };

  // ── Submit form ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Build payload - only include fields that are not empty
      const payload = {};
      if (formData.name.trim()) payload.name = formData.name;
      if (formData.phone.trim()) payload.phone = formData.phone;
      if (formData.address.trim()) payload.address = formData.address;
      if (formData.location.lat && formData.location.lng) {
        payload.location = {
          lat: parseFloat(formData.location.lat),
          lng: parseFloat(formData.location.lng)
        };
      }

      if (Object.keys(payload).length === 0) {
        setError('Please make at least one change');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const res = await axios.patch(
        `${API_BASE}/api/auth/profile`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Profile updated successfully!');
      
      // Call success callback with new user data
      if (onSuccess) {
        onSuccess(res.data.user);
      }

      // Close modal after brief delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-green-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Edit Profile</h2>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Success Message */}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
                  >
                    ✅ {success}
                  </motion.div>
                )}

                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={onChange}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={onChange}
                    placeholder="10-digit Indian mobile number"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be 10 digits starting with 6, 7, 8, or 9
                  </p>
                </div>

                {/* Address Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={onChange}
                    placeholder="Enter your address"
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Location Fields */}
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      📍 Location Coordinates
                    </label>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Use Current
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Latitude
                      </label>
                      <input
                        type="number"
                        name="location.lat"
                        value={formData.location.lat}
                        onChange={onChange}
                        placeholder="Latitude"
                        step="0.000001"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Longitude
                      </label>
                      <input
                        type="number"
                        name="location.lng"
                        value={formData.location.lng}
                        onChange={onChange}
                        placeholder="Longitude"
                        step="0.000001"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Info Message */}
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-xs">
                  <strong>Note:</strong> Your email address cannot be changed. If you need to change your email, please contact support.
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfileEdit;
