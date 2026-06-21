import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Users, Package, Truck, CheckCircle,
  MapPin, Phone, Mail, Clock, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileEdit from '../components/ProfileEdit';
import FeedbackModal from '../components/FeedbackModal';
import FeedbackAnalytics from '../components/FeedbackAnalytics';
import AIInsights from '../components/AIInsights';
import Logo from '../components/Logo';
import {
  Card, StatCard, Badge, StatusBadge, Button,
  EmptyState
} from '../components/ui';

const API = process.env.REACT_APP_SERVER_URL || 'http://localhost:5001';

// ─── Auth header helper ───────────────────────────────────────────────────────
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, y: -16, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -16, scale: 0.95 }}
    transition={{ type: 'spring', damping: 20 }}
    className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-lg shadow-lg max-w-sm text-white text-sm font-medium ${
      type === 'error'
        ? 'bg-gradient-to-r from-red-600 to-red-700'
        : 'bg-gradient-to-r from-green-600 to-emerald-600'
    }`}
  >
    <span className="flex-1">{message}</span>
    <button
      onClick={onDismiss}
      className="opacity-70 hover:opacity-100 ml-2 transition-opacity"
    >
      ✕
    </button>
  </motion.div>
);

// ─── NGODashboard ─────────────────────────────────────────────────────────────
const NGODashboard = () => {
  const { user, logout, updateUser } = useAuth();

  const [activeTab, setActiveTab]             = useState('overview');
  const [availableDonations, setAvailable]    = useState([]);
  const [claimedDonations, setClaimed]        = useState([]);
  const [awaitingConfirmationDonations, setAwaitingConfirmation] = useState([]);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [volunteers, setVolunteers]           = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [toast, setToast]                     = useState(null);

  // Modal state for volunteer assignment
  const [assignModal, setAssignModal]         = useState(null); // { donationId, donationLabel }
  const [selectedVolunteer, setSelectedVol]   = useState('');
  const [assigning, setAssigning]             = useState(false);

  // State for volunteer approval
  const [volunteerRequests, setVolunteerRequests] = useState([]);
  const [volunteerRequestsLoading, setVolunteerRequestsLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState(null); // { volunteerId, volunteerName }

  // State for delivery confirmation
  const [confirmingDeliveryId, setConfirmingDeliveryId] = useState(null);
  const [confirmingDeliveryLoading, setConfirmingDeliveryLoading] = useState(false);

  // State for coverage statistics
  const [coverageStats, setCoverageStats] = useState({
    nearby: 0,
    outsideCoverage: 0,
    total: 0
  });

  // State for feedback modal
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [selectedDonationForFeedback, setSelectedDonationForFeedback] = useState(null);

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const urls = {
        available: `${API}/api/ngo/donations/available`,
        claimed: `${API}/api/ngo/donations/claimed`,
        awaitingConfirmation: `${API}/api/ngo/donations/awaiting-confirmation`,
        volunteers: `${API}/api/ngo/volunteers/nearby`,
        volunteerRequests: `${API}/api/ngo/volunteer-requests`
      };

      console.log('🔍 NGO Dashboard API calls:');
      console.log('- Available donations:', urls.available);
      console.log('- Claimed donations:', urls.claimed);
      console.log('- Awaiting confirmation:', urls.awaitingConfirmation);
      console.log('- Volunteers:', urls.volunteers);
      console.log('- Volunteer requests:', urls.volunteerRequests);

      // Create timeout controller for each request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        // Use Promise.allSettled instead of Promise.all to allow partial failures
        const results = await Promise.allSettled([
          axios.get(urls.available, { ...authHeader(), signal: controller.signal }),
          axios.get(urls.claimed, { ...authHeader(), signal: controller.signal }),
          axios.get(urls.awaitingConfirmation, { ...authHeader(), signal: controller.signal }),
          axios.get(urls.volunteers, { ...authHeader(), signal: controller.signal }),
          axios.get(urls.volunteerRequests, { ...authHeader(), signal: controller.signal }),
        ]);
        
        clearTimeout(timeoutId);
        
        // Extract results safely
        const availRes = results[0]?.status === 'fulfilled' ? results[0].value : null;
        const claimedRes = results[1]?.status === 'fulfilled' ? results[1].value : null;
        const awaitingRes = results[2]?.status === 'fulfilled' ? results[2].value : null;
        const volRes = results[3]?.status === 'fulfilled' ? results[3].value : null;
        const volunteerRequestsRes = results[4]?.status === 'fulfilled' ? results[4].value : null;

        // Log which requests failed
        if (results[0]?.status === 'rejected') {
          console.error('❌ Available donations request failed:', results[0].reason);
        }
        if (results[1]?.status === 'rejected') {
          console.error('❌ Claimed donations request failed:', results[1].reason);
        }
        if (results[2]?.status === 'rejected') {
          console.error('❌ Awaiting confirmation request failed:', results[2].reason);
        }
        if (results[3]?.status === 'rejected') {
          console.error('❌ Volunteers request failed:', results[3].reason);
        }
        if (results[4]?.status === 'rejected') {
          console.error('❌ Volunteer requests failed:', results[4].reason);
        }

        console.log('✅ NGO data loading completed (partial success allowed)');
        console.log('- Available donations:', availRes?.data?.donations?.length || availRes?.data?.length || 'FAILED');
        console.log('- Claimed donations:', claimedRes?.data?.length || 'FAILED');
        console.log('- Awaiting confirmation:', awaitingRes?.data?.length || 'FAILED');
        console.log('- Available volunteers:', volRes?.data?.length || 'FAILED');
        console.log('- Volunteer requests:', volunteerRequestsRes?.data?.length || 'FAILED');

        // Handle new response format with coverage stats
        const availableData = availRes?.data;
        const donations = availRes ? (availableData?.donations || availableData || []).filter(d => d) : [];
        const coverageStats = availableData?.coverageStats || { 
          nearby: donations.length, 
          outsideCoverage: 0, 
          total: donations.length 
        };
        
        setAvailable(donations || []);
        setCoverageStats(coverageStats);
        setClaimed(claimedRes?.data || []);
        setAwaitingConfirmation(awaitingRes?.data || []);
        setVolunteers(volRes?.data || []);
        setVolunteerRequests(volunteerRequestsRes?.data || []);

        // Show toast if any endpoint failed
        const failedCount = results.filter(r => r.status === 'rejected').length;
        if (failedCount > 0) {
          console.warn(`⚠️ ${failedCount} of 5 API calls failed, but dashboard is showing available data`);
        }
      } catch (timeoutErr) {
        clearTimeout(timeoutId);
        throw timeoutErr;
      }
    } catch (err) {
      console.error('❌ NGO dashboard fetch error');
      console.error('- Status:', err.response?.status);
      console.error('- URL:', err.config?.url);
      console.error('- Method:', err.config?.method);
      console.error('- Data:', err.response?.data);
      console.error('- Message:', err.response?.data?.message || err.message);
      console.error('- Full error:', err);
      
      // Handle timeout specifically
      if (err.code === 'ECONNABORTED') {
        showToast('Request timeout - server may be slow. Please try again.', 'error');
      } else {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to load data';
        showToast(`Error: ${errorMsg}`, 'error');
      }
      
      // Reset to empty state on fatal error
      setAvailable([]);
      setClaimed([]);
      setAwaitingConfirmation([]);
      setVolunteers([]);
      setVolunteerRequests([]);
      setCoverageStats({ nearby: 0, outsideCoverage: 0, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // ── Fetch volunteer requests (separate function for tab-specific loading) ──
  const fetchVolunteerRequests = useCallback(async () => {
    if (activeTab !== 'volunteers') return;
    setVolunteerRequestsLoading(true);
    try {
      const res = await axios.get(`${API}/api/ngo/volunteer-requests`, authHeader());
      setVolunteerRequests(res.data);
    } catch (err) {
      console.error('❌ Volunteer requests fetch error');
      console.error('- Status:', err.response?.status);
      console.error('- Data:', err.response?.data);
      console.error('- Message:', err.response?.data?.message || err.message);
      showToast(err.response?.data?.message || 'Failed to load volunteer requests.', 'error');
    } finally {
      setVolunteerRequestsLoading(false);
    }
  }, [activeTab, showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Fetch volunteer requests when volunteers tab is active
  useEffect(() => {
    if (activeTab === 'volunteers') {
      fetchVolunteerRequests();
    }
  }, [activeTab, fetchVolunteerRequests]);

  // ── Claim donation ─────────────────────────────────────────────────────────
  const handleClaim = async (donationId) => {
    try {
      await axios.patch(`${API}/api/ngo/donations/${donationId}/claim`, {}, authHeader());
      showToast('Donation claimed successfully!');
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to claim donation.', 'error');
    }
  };

  // ── Open assign volunteer modal ────────────────────────────────────────────
  const openAssignModal = (donation) => {
    setAssignModal({ donationId: donation._id, donationLabel: donation.foodType });
    setSelectedVol('');
  };

  // ── Assign volunteer ───────────────────────────────────────────────────────
  const handleAssignVolunteer = async () => {
    if (!selectedVolunteer) { showToast('Please select a volunteer.', 'error'); return; }
    setAssigning(true);
    try {
      await axios.patch(
        `${API}/api/ngo/donations/${assignModal.donationId}/assign-volunteer`,
        { volunteerId: selectedVolunteer },
        authHeader()
      );
      showToast('Volunteer assigned successfully!');
      setAssignModal(null);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign volunteer.', 'error');
    } finally {
      setAssigning(false);
    }
  };

  // ── Confirm delivery ───────────────────────────────────────────────────────
  const handleConfirm = async (donationId) => {
    try {
      await axios.patch(`${API}/api/ngo/donations/${donationId}/confirm`, {}, authHeader());
      showToast('Delivery confirmed!');
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to confirm.', 'error');
    }
  };

  // ── Confirm delivery (new OTP-based workflow) ──────────────────────────────
  const handleConfirmDelivery = async (donationId) => {
    setConfirmingDeliveryId(donationId);
    setConfirmingDeliveryLoading(true);
    try {
      await axios.put(
        `${API}/api/ngo/donations/${donationId}/confirm-delivery`,
        {},
        authHeader()
      );
      showToast('✅ Delivery confirmed successfully!');
      setConfirmingDeliveryId(null);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to confirm delivery.', 'error');
      setConfirmingDeliveryId(null);
    } finally {
      setConfirmingDeliveryLoading(false);
    }
  };

  // ── Approve volunteer ──────────────────────────────────────────────────────
  const handleApproveVolunteer = async (volunteerId, volunteerName) => {
    try {
      await axios.patch(`${API}/api/ngo/volunteers/${volunteerId}/approve`, {}, authHeader());
      showToast(`Volunteer "${volunteerName}" approved successfully!`);
      fetchVolunteerRequests();
      // Also refresh volunteers list for assignment
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve volunteer.', 'error');
    }
  };

  // ── Reject volunteer ───────────────────────────────────────────────────────
  const handleRejectVolunteer = async (volunteerId, volunteerName, note) => {
    try {
      await axios.patch(`${API}/api/ngo/volunteers/${volunteerId}/reject`, { note }, authHeader());
      showToast(`Volunteer "${volunteerName}" rejected.`);
      setRejectModal(null);
      fetchVolunteerRequests();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject volunteer.', 'error');
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = {
    available:  availableDonations.length,
    claimed:    claimedDonations.filter(d => ['accepted_by_ngo','assigned_to_volunteer','picked_up'].includes(d.status)).length,
    delivered:  claimedDonations.filter(d => d.status === 'completed').length,
    confirmed:  claimedDonations.filter(d => d.status === 'completed').length,
    nearby:     coverageStats.nearby,
    outside:    coverageStats.outsideCoverage,
    total:      coverageStats.total
  };

  const TABS = [
    { id: 'overview',   label: 'Overview',            count: null              },
    { id: 'available',  label: 'Available Donations',  count: stats.available   },
    { id: 'claimed',    label: 'Claimed Donations',    count: stats.claimed     },
    { id: 'awaiting',   label: 'Awaiting Confirmation', count: awaitingConfirmationDonations.length },
    { id: 'volunteers', label: 'Volunteer Approvals',  count: volunteerRequests.filter(v => v.volunteerApprovalStatus === 'pending').length },
    { id: 'completed',  label: 'Completed',            count: stats.confirmed   },
    { id: 'feedback',   label: 'Feedback Analytics',   count: null              },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-emerald-50">

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Logo size="medium" />
            <div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">NGO Dashboard</h1>
              <p className="text-sm text-gray-500">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
              ✓ Approved
            </span>
            <button
              onClick={() => fetchAll()}
              className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200"
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => setProfileEditOpen(true)}
              className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200"
            >
              👤 Profile
            </button>
            <button
              onClick={logout}
              className="px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto border-t border-emerald-100/30">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                    : 'border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full px-2 py-0.5">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >

              {/* ── OVERVIEW ─────────────────────────────────────────────── */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Available',  value: stats.available,  color: 'yellow', icon: '🍱' },
                      { label: 'Active',     value: stats.claimed,    color: 'blue',   icon: '📋' },
                      { label: 'Delivered',  value: stats.delivered,  color: 'teal',   icon: '🚚' },
                      { label: 'Confirmed',  value: stats.confirmed,  color: 'green',  icon: '✅' },
                    ].map(({ label, value, color, icon }) => (
                      <div key={label} className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-emerald-100/50 p-5 hover:shadow-md transition-all">
                        <div className="text-3xl mb-2">{icon}</div>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Coverage Statistics - Modern Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                      icon={MapPin}
                      label="Nearby Donations"
                      value={stats.nearby}
                      subtitle="Within 5km radius"
                      gradient
                    />
                    <StatCard
                      icon={AlertCircle}
                      label="Outside Coverage"
                      value={stats.outside}
                      subtitle="Beyond 5km radius"
                    />
                    <StatCard
                      icon={Package}
                      label="Total Pending"
                      value={stats.total}
                      subtitle="All pending donations"
                      gradient
                    />
                  </div>

                  {/* Coverage Notice */}
                  {stats.outside > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-xl p-4 mb-6 backdrop-blur-sm border border-amber-200"
                    >
                      <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-900 mb-1">
                            Donations Outside Coverage Area
                          </p>
                          <p className="text-sm text-amber-800">
                            {stats.outside} donation(s) are beyond your 5km coverage radius. 
                            You can only claim donations within your service area.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Quick Actions */}
                  <Card className="p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Quick Actions
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => setActiveTab('available')}
                        icon={Package}
                      >
                        View Donations
                      </Button>
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => setActiveTab('claimed')}
                        icon={Truck}
                      >
                        Track Deliveries
                      </Button>
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => setActiveTab('volunteers')}
                        icon={Users}
                      >
                        Approve Volunteers
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

              {/* ── AVAILABLE DONATIONS ──────────────────────────────────── */}
              {activeTab === 'available' && (
                <div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Available Donations ({availableDonations.length})
                      </h2>
                      <p className="text-sm text-gray-500">
                        Showing donations within 5km radius of your location
                        {coverageStats.warning && (
                          <span className="text-amber-600 ml-2">⚠️ {coverageStats.warning}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                        <span className="font-semibold text-green-600">{stats.nearby}</span> nearby · 
                        <span className="font-semibold text-gray-600 ml-2">{stats.outside}</span> outside coverage
                      </div>
                      <button
                        onClick={() => fetchAll()}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        🔄 Refresh
                      </button>
                    </div>
                  </div>
                  
                  {availableDonations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-4">🍱</div>
                      <p className="text-gray-500 mb-2">No pending donations available within 5km radius.</p>
                      {stats.outside > 0 && (
                        <p className="text-sm text-gray-400">
                          There are {stats.outside} donation(s) outside your coverage area.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {availableDonations.map(d => (
                        <DonationCard
                          key={d._id}
                          donation={d}
                          action={
                            <button
                              onClick={() => handleClaim(d._id)}
                              className="w-full mt-4 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors"
                            >
                              Claim Donation
                            </button>
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── CLAIMED DONATIONS ────────────────────────────────────── */}
              {activeTab === 'claimed' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">
                    Active Claimed Donations ({stats.claimed})
                  </h2>
                  {stats.claimed === 0 ? (
                    <EmptyState message="No active claimed donations." icon="📋" />
                  ) : (
                    <div className="space-y-4">
                      {claimedDonations
                        .filter(d => ['accepted_by_ngo','assigned_to_volunteer','picked_up'].includes(d.status))
                        .map(d => (
                          <ClaimedDonationRow
                            key={d._id}
                            donation={d}
                            onAssign={() => openAssignModal(d)}
                            onConfirm={() => handleConfirm(d._id)}
                          />
                        ))
                      }
                    </div>
                  )}
                </div>
              )}

              {/* ── AWAITING CONFIRMATION ─────────────────────────────────── */}
              {activeTab === 'awaiting' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">
                    Awaiting Confirmation ({awaitingConfirmationDonations.length})
                  </h2>
                  {awaitingConfirmationDonations.length === 0 ? (
                    <EmptyState message="No donations awaiting confirmation." icon="⏳" />
                  ) : (
                    <div className="space-y-4">
                      {awaitingConfirmationDonations.map(d => (
                        <Card key={d._id} className="overflow-hidden hover" variant="gradient" hover>
                          <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <div className="flex items-center gap-3 mb-2">
                                  <StatusBadge status={d.status} size="md" />
                                  <h3 className="font-semibold text-lg text-gray-900 capitalize">
                                    {d.foodType}
                                  </h3>
                                </div>
                                <p className="text-sm text-gray-600">
                                  Volunteer: {d.assignedVolunteer?.name} ({d.assignedVolunteer?.phone})
                                </p>
                              </div>
                              <div className="text-3xl">
                                {d.foodType === 'vegetarian' ? '🥗' : d.foodType === 'non-vegetarian' ? '🍖' : '🍽️'}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 font-medium">Quantity</p>
                                <p className="text-sm font-semibold text-gray-900">{d.quantity} {d.unit}</p>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 font-medium">Donor</p>
                                <p className="text-sm font-semibold text-gray-900">{d.donor?.name}</p>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 font-medium">Delivered At</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {d.deliveredAt ? new Date(d.deliveredAt).toLocaleString() : 'N/A'}
                                </p>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 font-medium">OTP Status</p>
                                <p className="text-sm font-semibold text-green-600">✓ Verified</p>
                              </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Donor Info</p>
                              <div className="text-sm text-gray-700">
                                <p><strong>Name:</strong> {d.donor?.name}</p>
                                <p><strong>Phone:</strong> {d.donor?.phone}</p>
                                <p><strong>Address:</strong> {d.location?.address}</p>
                              </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                              <Button
                                variant="primary"
                                size="md"
                                fullWidth
                                onClick={() => handleConfirmDelivery(d._id)}
                                disabled={confirmingDeliveryId === d._id && confirmingDeliveryLoading}
                                icon={CheckCircle}
                              >
                                {confirmingDeliveryId === d._id && confirmingDeliveryLoading ? 'Confirming...' : 'Confirm Receipt'}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── COMPLETED ────────────────────────────────────────────── */}
              {activeTab === 'completed' && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">
                    Completed &amp; Confirmed ({stats.confirmed})
                  </h2>
                  {stats.confirmed === 0 ? (
                    <EmptyState message="No completed donations yet." icon="✅" />
                  ) : (
                    <div className="space-y-4">
                      {claimedDonations
                        .filter(d => d.status === 'completed')
                        .map(d => (
                          <ClaimedDonationRow 
                            key={d._id} 
                            donation={d}
                            onFeedback={() => {
                              setSelectedDonationForFeedback(d);
                              setFeedbackModalOpen(true);
                            }}
                          />
                        ))
                      }
                    </div>
                  )}
                </div>
              )}

              {/* ── VOLUNTEER APPROVALS ────────────────────────────────────── */}
              {activeTab === 'volunteers' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Volunteer Approval Requests
                    </h2>
                    <button
                      onClick={fetchVolunteerRequests}
                      disabled={volunteerRequestsLoading}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {volunteerRequestsLoading ? 'Refreshing...' : '🔄 Refresh'}
                    </button>
                  </div>
                  
                  {volunteerRequestsLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full" />
                    </div>
                  ) : volunteerRequests.length === 0 ? (
                    <EmptyState message="No volunteer requests pending approval." icon="🚚" />
                  ) : (
                    <div className="space-y-4">
                      {volunteerRequests.map(volunteer => (
                        <VolunteerRequestCard
                          key={volunteer._id}
                          volunteer={volunteer}
                          onApprove={handleApproveVolunteer}
                          onReject={(id, name) => setRejectModal({ volunteerId: id, volunteerName: name })}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── FEEDBACK ANALYTICS ───────────────────────────────────── */}
              {activeTab === 'feedback' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">
                      Your Feedback & Ratings
                    </h2>
                    <FeedbackAnalytics userId={user?._id} />
                  </div>
                  
                  <div>
                    <AIInsights ngoId={user?._id} />
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* ── Assign Volunteer Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {assignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setAssignModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md max-h-[80vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-1">Assign Volunteer</h3>
              <p className="text-sm text-gray-500 mb-6">
                Donation: <span className="font-medium text-gray-800 capitalize">{assignModal.donationLabel}</span>
              </p>

              {volunteers.length === 0 ? (
                <p className="text-sm text-gray-500 mb-6">No available volunteers right now.</p>
              ) : (
                <div className="flex-1 overflow-y-auto mb-6 -mx-2 px-2">
                  <div className="space-y-2">
                    {volunteers.map(v => {
                      const distance = v.location?.coordinates ? '?' : null;
                      return (
                        <button
                          key={v._id}
                          onClick={() => setSelectedVol(v._id)}
                          className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                            selectedVolunteer === v._id
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-gray-900">{v.name}</p>
                              <p className="text-xs text-gray-500">{v.phone} · {v.email}</p>
                            </div>
                            {distance && <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">{distance} km</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setAssignModal(null)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignVolunteer}
                  disabled={assigning || !selectedVolunteer}
                  className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {assigning ? 'Assigning…' : 'Assign'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Reject Volunteer Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setRejectModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-1">Reject Volunteer</h3>
              <p className="text-sm text-gray-500 mb-6">
                Volunteer: <span className="font-medium text-gray-800">{rejectModal.volunteerName}</span>
              </p>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Rejection Reason (Optional)
                </label>
                <textarea
                  id="rejectReason"
                  placeholder="Provide a reason for rejection (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none min-h-[100px]"
                  defaultValue=""
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setRejectModal(null)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const note = document.getElementById('rejectReason')?.value || '';
                    handleRejectVolunteer(rejectModal.volunteerId, rejectModal.volunteerName, note);
                  }}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                >
                  Reject Volunteer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => {
          setFeedbackModalOpen(false);
          setSelectedDonationForFeedback(null);
          fetchAll();
        }}
        donation={selectedDonationForFeedback}
        feedbackType="ngo-to-volunteer"
        currentUserRole="ngo"
      />

    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const DonationCard = ({ donation: d, action }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="font-semibold text-gray-900 capitalize">{d.foodType}</h3>
        <p className="text-sm text-gray-500">{d.quantity} {d.unit}</p>
      </div>
      <StatusBadge status={d.status} />
    </div>
    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{d.description}</p>
    <div className="text-xs text-gray-400 space-y-1">
      <p>📍 {d.location?.address || '—'}</p>
      <p>📅 Pickup: {new Date(d.pickupTime).toLocaleString()}</p>
      {d.donor && <p>👤 {d.donor.name} · {d.donor.phone}</p>}
    </div>
    {action}
  </div>
);

const ClaimedDonationRow = ({ donation: d, onAssign, onConfirm, onFeedback }) => {
  return (
    <Card className="p-6" variant="default">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Left: Donation Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <StatusBadge status={d.status} size="md" />
            <h3 className="font-semibold text-lg text-gray-900 capitalize">
              {d.foodType}
            </h3>
            <Badge variant="primary" size="sm">
              {d.quantity} {d.unit}
            </Badge>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2 text-gray-600">
              <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{d.location?.address || 'No address provided'}</span>
            </div>
            <div className="flex items-start gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                Pickup: {new Date(d.pickupTime).toLocaleDateString()}
              </span>
            </div>
            {d.donor && (
              <div className="flex items-start gap-2 text-gray-600">
                <Mail className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Donor: {d.donor.name}</span>
              </div>
            )}
            {d.assignedVolunteer ? (
              <div className="flex items-start gap-2 text-emerald-600 font-medium">
                <Users className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Volunteer: {d.assignedVolunteer.name}</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-amber-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>No volunteer assigned</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex gap-2 flex-shrink-0 sm:flex-col">
          {d.status === 'accepted_by_ngo' && onAssign && (
            <Button
              variant="secondary"
              size="md"
              onClick={onAssign}
              icon={Users}
              fullWidth
            >
              Assign Volunteer
            </Button>
          )}
          {d.status === 'completed' && onConfirm && (
            <Button
              variant="primary"
              size="md"
              onClick={onConfirm}
              icon={CheckCircle}
              fullWidth
            >
              Confirm Receipt
            </Button>
          )}
          {d.status === 'completed' && !onConfirm && onFeedback && (
            <Button
              variant="secondary"
              size="md"
              onClick={onFeedback}
              fullWidth
            >
              Rate Volunteer
            </Button>
          )}
          {d.status === 'completed' && !onConfirm && !onFeedback && (
            <Badge variant="success" size="md">
              ✓ Confirmed
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};

// ─── Volunteer Request Card ─────────────────────────────────────────────────
const VolunteerRequestCard = ({ volunteer, onApprove, onReject }) => {
  const approvalStatus = volunteer.volunteerApprovalStatus || 'pending';

  const getStatusBadge = () => {
    switch (approvalStatus) {
      case 'approved':
        return <Badge variant="success" size="md">✓ Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger" size="md">✗ Rejected</Badge>;
      default:
        return <Badge variant="warning" size="md">⏳ Pending Review</Badge>;
    }
  };

  return (
    <Card className="p-6" variant="default">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        {/* Volunteer Info */}
        <div className="flex gap-4 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
            {volunteer.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <h3 className="font-semibold text-lg text-gray-900">
                {volunteer.name}
              </h3>
              {getStatusBadge()}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {volunteer.email || 'No email'}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {volunteer.phone || 'No phone'}
              </div>
              {volunteer.location && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">
                    {volunteer.location.address ||
                      `${volunteer.location.lat?.toFixed(4)}, ${volunteer.location.lng?.toFixed(4)}`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                Joined {volunteer.createdAt ? new Date(volunteer.createdAt).toLocaleDateString() : 'recently'}
              </div>
            </div>

            {/* Rejection Reason */}
            {volunteer.volunteerApprovalNote && approvalStatus === 'rejected' && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  <span className="font-semibold">Rejection reason: </span>
                  {volunteer.volunteerApprovalNote}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {approvalStatus === 'pending' && (
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={() => onApprove(volunteer._id, volunteer.name)}
              icon={CheckCircle}
            >
              Approve
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={() => onReject(volunteer._id, volunteer.name)}
              icon={AlertCircle}
            >
              Reject
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default NGODashboard;
