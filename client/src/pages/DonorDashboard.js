import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { CheckCircle, LogOut, User, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DonationForm from '../components/DonationForm';
import ProfileEdit from '../components/ProfileEdit';
import SocialShare from '../components/SocialShare';
import FeedbackModal from '../components/FeedbackModal';
import Logo from '../components/Logo';
import { Card, StatCard, Button, EmptyState, StatusBadge } from '../components/ui';
import API_BASE_URL from '../config/api';

const API_BASE = API_BASE_URL;

// ─── Toast component ──────────────────────────────────────────────────────────
// Self-contained; auto-dismisses after `duration` ms.

const Toast = ({ message, type = 'success', onDismiss }) => {
  const styles = {
    success: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    error:   'bg-gradient-to-r from-orange-600 to-red-600',
    info:    'bg-gradient-to-r from-blue-600 to-cyan-600',
  };
  const icons = {
    success: (
      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,   scale: 1    }}
      exit={{    opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl max-w-sm text-white ${styles[type]}`}
    >
      {icons[type]}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button
        onClick={onDismiss}
        className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
};

// ─── useToast hook ────────────────────────────────────────────────────────────

const useToast = (duration = 4000) => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismissToast, duration);
    return () => clearTimeout(t);
  }, [toast, duration, dismissToast]);

  return { toast, showToast, dismissToast };
};

// ─── DonorDashboard ───────────────────────────────────────────────────────────

const DonorDashboard = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedDonationForFeedback, setSelectedDonationForFeedback] = useState(null);
  const { logout, user, updateUser } = useAuth();
  const { toast, showToast, dismissToast } = useToast(4000);

  // ── Fetch donations ─────────────────────────────────────────────────────────

  const fetchMyDonations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE}/api/donations/my-donations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // API already sorts by createdAt desc; keep that order
      setDonations(res.data);
    } catch (error) {
      console.error('Error fetching donations:', error);
      showToast('Failed to load donations. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMyDonations();
  }, [fetchMyDonations]);

  // ── Handle feedback submission success ───────────────────────────────────────
  
  const handleFeedbackSuccess = useCallback((donationId) => {
    // Update local state immediately to hide button
    setDonations(prevDonations =>
      prevDonations.map(d =>
        d._id === donationId ? { ...d, hasDonorFeedback: true } : d
      )
    );
    showToast('Feedback submitted successfully!', 'success');
  }, [showToast]);

  // ── Handle successful donation creation ─────────────────────────────────────
  //
  // Called by DonationForm with the newly created donation document.
  //
  // Why we prepend instead of re-fetching:
  //  - The backend returns the full populated donation on POST — we already have
  //    the data. A second GET would be a wasted round-trip.
  //  - Prepending keeps the list sorted newest-first, matching the server sort.
  //  - The user sees the new row instantly with a highlighted animation.

  const handleDonationCreated = useCallback((newDonation) => {
    setDonations(prev => [newDonation, ...prev]); // prepend → newest first
    setShowForm(false);                           // return to dashboard view
    showToast('🍱 Donation created successfully!', 'success');
  }, [showToast]);

  // ── Derived stats (recomputed on every render — cheap) ──────────────────────

  const pendingCount   = donations.filter(d => d.status === 'pending').length;
  const completedCount = donations.filter(d => d.status === 'completed').length;

  // ── Form view ────────────────────────────────────────────────────────────────

  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-emerald-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowForm(false)}
            icon={LogOut}
          >
            Back to Dashboard
          </Button>

          <div className="mt-6">
            <DonationForm
              onSuccess={handleDonationCreated}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard view ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-emerald-50">

      {/* Toast — rendered at fixed top-right, outside the normal flow */}
      <AnimatePresence>
        {toast && (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onDismiss={dismissToast}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-emerald-100/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Logo size="medium" />
              <div>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">Donor Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowForm(true)}
                icon={Plus}
              >
                New Donation
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setProfileEditOpen(true)}
                icon={User}
              >
                Profile
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={logout}
                icon={LogOut}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={CheckCircle}
            label="Pending Donations"
            value={pendingCount}
            subtitle="Awaiting NGO confirmation"
            gradient
          />
          <StatCard
            icon={CheckCircle}
            label="Total Donations"
            value={donations.length}
            subtitle="All donations submitted"
          />
          <StatCard
            icon={CheckCircle}
            label="Completed"
            value={completedCount}
            subtitle="Successfully delivered"
            gradient
          />
        </div>

        {/* Donations table */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-emerald-100/50 overflow-hidden hover:shadow-md transition-all">
          <div className="px-6 py-4 border-b border-emerald-100/30 bg-gradient-to-r from-blue-50/50 to-emerald-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Donations</h2>
              <p className="text-sm text-gray-500 mt-0.5">Track your food donations and delivery status</p>
            </div>
            {donations.length > 0 && (
              <span className="text-xs text-gray-400">{donations.length} total</span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
            </div>
          ) : donations.length === 0 ? (
            <EmptyState
              message="Start making a difference by creating your first food donation"
              icon="📦"
              action={
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowForm(true)}
                  icon={Plus}
                >
                  Create Your First Donation
                </Button>
              }
            />
          ) : (
            <div className="p-6 space-y-4">
              <AnimatePresence initial={false}>
                {donations.map((donation, index) => (
                  <motion.div
                    key={donation._id}
                    initial={index === 0 ? { opacity: 0, x: -20 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="overflow-hidden hover" variant="gradient" hover>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {/* Food Details */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              Food Details
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-lg flex items-center justify-center text-xl">
                                {donation.foodType === 'vegetarian'
                                  ? '🥗'
                                  : donation.foodType === 'non-vegetarian'
                                  ? '🍖'
                                  : '🍽️'}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900 capitalize">
                                  {donation.foodType}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {donation.quantity} {donation.unit}
                                </p>
                                <p className="text-xs text-gray-500 truncate max-w-xs mt-0.5">
                                  {donation.description}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Pickup Info */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              Pickup Time
                            </p>
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-gray-900">
                                {new Date(donation.pickupTime).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-600">
                                {new Date(donation.pickupTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>

                          {/* Status & Volunteer */}
                          <div className="flex flex-col justify-between">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Status
                              </p>
                              <StatusBadge status={donation.status} size="md" />
                            </div>
                            {donation.assignedVolunteer && (
                              <div className="mt-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                  Volunteer
                                </p>
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-bold text-blue-600">
                                      {donation.assignedVolunteer.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-gray-900">
                                      {donation.assignedVolunteer.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {donation.assignedVolunteer.phone}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* OTP Status for assigned donations */}
                            {donation.status === 'assigned_to_volunteer' && (
                              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-xs font-medium text-blue-700">
                                  🔐 OTP sent to your email
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                  Share OTP with volunteer only when they arrive
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Created Date Footer */}
                        <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                          <p className="text-xs text-gray-500">
                            Created on {new Date(donation.createdAt).toLocaleDateString()}
                          </p>
                          {donation.status === 'completed' && !donation.hasDonorFeedback && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setSelectedDonationForFeedback(donation);
                                setFeedbackModalOpen(true);
                              }}
                            >
                              Leave Feedback
                            </Button>
                          )}
                          {donation.status === 'completed' && donation.hasDonorFeedback && (
                            <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700">Feedback Submitted ✓</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Social sharing / Impact */}
        {donations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SocialShare
                donation={donations[0]}
                impact={{ mealsSaved: donations.length * 4, co2Reduced: donations.length * 0.8 }}
                shareType="donation"
              />
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Impact</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Total Donations', value: donations.length,                      color: 'green', emoji: '🛒' },
                    { label: 'Meals Saved',     value: donations.length * 4,                  color: 'blue',  emoji: '📖' },
                    { label: 'CO₂ Reduced (kg)',value: (donations.length * 0.8).toFixed(1),   color: 'teal',  emoji: '🌍' },
                  ].map(({ label, value, color, emoji }) => (
                    <div key={label} className={`flex items-center justify-between p-4 bg-${color}-50 rounded-lg`}>
                      <div className="flex items-center">
                        <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center mr-3`}>
                          <span className="text-lg">{emoji}</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">{label}</p>
                          <p className="text-xl font-bold text-gray-900">{value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Profile Edit Modal */}
      <ProfileEdit
        isOpen={profileEditOpen}
        user={user}
        onClose={() => setProfileEditOpen(false)}
        onSuccess={(updatedUser) => {
          updateUser(updatedUser);
          showToast('Profile updated successfully!', 'success');
        }}
      />

      {/* Feedback Modal - Donor to NGO */}
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => {
          setFeedbackModalOpen(false);
          setSelectedDonationForFeedback(null);
        }}
        donation={selectedDonationForFeedback}
        feedbackType="donor-to-ngo"
        currentUserRole="donor"
        onSuccess={handleFeedbackSuccess}
      />

      {/* Feedback Modal - Donor to Volunteer */}
      {selectedDonationForFeedback && selectedDonationForFeedback.assignedVolunteer && (
        <FeedbackModal
          isOpen={feedbackModalOpen}
          onClose={() => {
            setFeedbackModalOpen(false);
            setSelectedDonationForFeedback(null);
          }}
          donation={selectedDonationForFeedback}
          feedbackType="donor-to-volunteer"
          currentUserRole="donor"
          onSuccess={handleFeedbackSuccess}
        />
      )}
    </div>
  );
};

export default DonorDashboard;
