import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { LogOut, User, MapPin, Phone, Clock, AlertCircle, CheckCircle, Truck } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ProfileEdit from '../components/ProfileEdit';
import Logo from '../components/Logo';
import CalendarIntegration from '../components/CalendarIntegration';
import ImageModal from '../components/ImageModal';
import FeedbackAnalytics from '../components/FeedbackAnalytics';
import VolunteerPendingScreen from './VolunteerPendingScreen';
import { Card, StatCard, Badge, StatusBadge, Button, EmptyState } from '../components/ui';
import API_BASE_URL, { getImageUrl } from '../config/api';

const VolunteerDashboard = () => {
  const [assignedDonationsState, setAssignedDonationsState] = useState([]); // assigned_to_volunteer status
  const [myAssignments, setMyAssignments] = useState([]); // picked_up and completed statuses
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpDonationId, setOtpDonationId] = useState(null);
  const [otpValue, setOtpValue] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const { user, logout, updateUser } = useAuth();

  const fetchVolunteerData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      console.log('Fetching volunteer data...');
      console.log('User availability:', user?.isAvailable);

      // Create timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        // Fetch donations assigned to this volunteer (NGO-mediated workflow)
        // This endpoint only returns donations with assignedVolunteer === user._id
        const [assignedRes, assignmentsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/donations/volunteer-assigned`, { ...config, signal: controller.signal }),
          axios.get(`${API_BASE_URL}/api/volunteers/my-assignments`, { ...config, signal: controller.signal })
        ]);

        clearTimeout(timeoutId);

        console.log('Assigned donations response:', assignedRes.data);
        console.log('Assignments response:', assignmentsRes.data);
        
        // Log volunteer assignments with detailed info
        if (assignmentsRes.data && Array.isArray(assignmentsRes.data)) {
          console.log('Volunteer assignments:', assignmentsRes.data.map(d => ({
            id: d._id,
            status: d.status,
            foodType: d.foodType,
            assignedVolunteer: d.assignedVolunteer
          })));
        }

        setAssignedDonationsState(assignedRes.data || []);
        setMyAssignments(assignmentsRes.data || []);
        console.log('API data loaded successfully for volunteer');
      } catch (timeoutErr) {
        clearTimeout(timeoutId);
        throw timeoutErr;
      }
    } catch (error) {
      console.error('Error fetching volunteer data:', error.response?.data || error.message);
      console.error('Full error:', error);
      
      // Handle timeout specifically
      if (error.code === 'ECONNABORTED') {
        console.log('Request timeout - server may be slow');
        alert('Request timeout. Please check your connection and try again.');
      } else if (error.response?.status === 403) {
        console.log('Access denied - user might not be available');
        setAssignedDonationsState([]);
        setMyAssignments([]);
      } else if (error.response?.status === 401) {
        console.log('Authentication error');
        alert('Authentication error. Please login again.');
      } else {
        alert('Failed to load donations. Please try again.');
      }
      
      // Ensure state is reset on error
      setAssignedDonationsState([]);
      setMyAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.volunteerApprovalStatus === 'approved') {
      fetchVolunteerData();
    }
  }, [user, fetchVolunteerData]);

  // Check volunteer approval status - must be after all hooks
  if (user && user.role === 'volunteer' && user.volunteerApprovalStatus !== 'approved') {
    return (
      <VolunteerPendingScreen
        status={user.volunteerApprovalStatus}
        note={user.volunteerApprovalNote}
        ngoName={user.ngoName}
      />
    );
  }

  const handleVerifyOTP = async (donationId) => {
    setOtpDonationId(donationId);
    setOtpValue('');
    setOtpModalOpen(true);
  };

  const submitOTPVerification = async () => {
    if (!otpValue || !/^\d{6}$/.test(otpValue)) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    setOtpVerifying(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      console.log('Verifying OTP for donation:', otpDonationId);
      await axios.post(
        `${API_BASE_URL}/api/donations/${otpDonationId}/verify-pickup`,
        { otp: otpValue },
        config
      );
      
      console.log('OTP verified successfully');
      alert('✅ Pickup verified successfully! You can now mark as delivered.');
      setOtpModalOpen(false);
      setOtpValue('');
      setOtpDonationId(null);
      await fetchVolunteerData();
    } catch (error) {
      console.error('Error verifying OTP:', error.response?.data || error.message);
      alert(error.response?.data?.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleUpdateStatus = async (donationId, status) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      console.log('Updating status for donation:', donationId, 'to:', status);
      await axios.patch(`${API_BASE_URL}/api/donations/${donationId}/status`, { status }, config);
      
      console.log('Status updated, refreshing data...');
      // Refresh data from backend - essential to get the updated status
      await fetchVolunteerData();
      
      if (status === 'awaiting_ngo_confirmation') {
        alert('✅ Marked as delivered! NGO will now confirm receipt.');
      } else {
        alert(`Status updated to ${status}!`);
      }
    } catch (error) {
      console.error('Error updating status:', error.response?.data || error.message);
      alert(error.response?.data?.message || 'Failed to update status. Please try again.');
    }
  };

  // Image handling functions
  const openImageModal = (imageSrc, altText) => {
    setSelectedImage({ src: imageSrc, alt: altText });
    setIsModalOpen(true);
  };

  const closeImageModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const toggleAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const newAvailability = !user.isAvailable;
      console.log('Toggling availability to:', newAvailability);
      
      // Call API to update availability in database
      const response = await axios.patch(`${API_BASE_URL}/api/volunteers/availability`, 
        { isAvailable: newAvailability }, config);
      
      console.log('API response:', response.data);
      
      // Update user state in AuthContext
      if (updateUser) {
        updateUser({ ...user, isAvailable: newAvailability });
      }
      
      alert(`You are now ${newAvailability ? 'Available' : 'Unavailable'}`);
      
      // Refresh data to see donations if now available
      if (newAvailability) {
        setTimeout(() => {
          fetchVolunteerData();
        }, 500);
      }
    } catch (error) {
      console.error('Error updating availability:', error.response?.data || error.message);
      alert('Failed to update availability. Please try again.');
    }
  };

  // Dashboard sections:
  // - assignedDonations: assigned_to_volunteer status (from assignedDonationsState)
  // - pickedUpDonations: picked_up status (from myAssignments)
  // - awaitingConfirmationDonations: awaiting_ngo_confirmation status (from myAssignments)
  // - completedDonations: completed status (from myAssignments)
  const assignedDonations = assignedDonationsState;
  const pickedUpDonations = myAssignments.filter(d => d.status === 'picked_up');
  const awaitingConfirmationDonations = myAssignments.filter(d => d.status === 'awaiting_ngo_confirmation');
  const completedDonations = myAssignments.filter(d => d.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-emerald-100/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Logo size="medium" />
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">Volunteer Dashboard</h1>
                <p className="text-sm text-gray-500">Ready to make a difference, {user?.name}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={toggleAvailability}
                className={`px-4 py-2 rounded-xl font-medium transition duration-200 flex items-center border ${
                  user.isAvailable 
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mr-2 ${user.isAvailable ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                {user.isAvailable ? 'Available' : 'Unavailable'}
              </button>
              <button
                onClick={() => {
                  console.log('Refreshing volunteer data...');
                  fetchVolunteerData();
                }}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition duration-200 flex items-center font-medium border border-blue-200"
                title="Refresh data from server"
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => setProfileEditOpen(true)}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition duration-200 flex items-center font-medium border border-blue-200"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition duration-200 flex items-center font-medium border border-blue-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={MapPin}
            label="Assigned"
            value={assignedDonations.length}
            subtitle="Ready to accept"
            gradient
          />
          <StatCard
            icon={Truck}
            label="Picked Up"
            value={pickedUpDonations.length}
            subtitle="Awaiting OTP verification"
          />
          <StatCard
            icon={CheckCircle}
            label="Awaiting NGO"
            value={awaitingConfirmationDonations.length}
            subtitle="Marked as delivered"
            gradient
          />
          <StatCard
            icon={AlertCircle}
            label="Completed"
            value={completedDonations.length}
            subtitle="NGO confirmed"
          />
        </div>

        {/* Assigned Donations - Ready to Accept */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Assigned Donations</h2>
            <p className="text-sm text-gray-500 mt-1">Food donations assigned to you - ready to accept and pickup</p>
          </div>
          
          {!user.isAvailable ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">You're currently unavailable</h3>
              <p className="text-gray-500 mb-6">Toggle your availability to see assigned donations</p>
              <button
                onClick={toggleAvailability}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition duration-200 font-medium"
              >
                Set as Available
              </button>
            </div>
          ) : assignedDonations.length === 0 ? (
            <EmptyState
              message="NGO will assign donations to you when they become available"
              icon="🍱"
            />
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignedDonations.map((donation) => (
                    <Card
                      className="overflow-hidden hover"
                      variant="gradient"
                      hover
                    >
                      {/* Image Section */}
                      {donation.images && donation.images.length > 0 && (
                        <div className="relative h-48 bg-gray-100">
                          <img
                            src={getImageUrl(donation.images[0])}
                            alt={donation.foodType}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() =>
                              openImageModal(
                                getImageUrl(donation.images[0]),
                                donation.foodType
                              )
                            }
                          />
                          {donation.images.length > 1 && (
                            <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-medium">
                              +{donation.images.length - 1}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-6">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={donation.status} size="md" />
                          </div>
                          <div className="text-3xl">
                            {donation.foodType === 'vegetarian'
                              ? '🥗'
                              : donation.foodType === 'non-vegetarian'
                              ? '🍖'
                              : '🍽️'}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-lg text-gray-900 mb-4 capitalize">
                          {donation.foodType}
                        </h3>

                        {/* Key Info */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-medium">
                              Quantity:
                            </span>
                            <Badge variant="primary" size="sm">
                              {donation.quantity} {donation.unit}
                            </Badge>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-gray-600">Pickup Time</p>
                              <p className="font-medium text-gray-900">
                                {new Date(donation.pickupTime).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 text-sm">
                            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-gray-600">Expires</p>
                              <p className="font-medium text-gray-900">
                                {new Date(donation.expiryDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {donation.description}
                          </p>
                        </div>

                        {/* Donor Info */}
                        <div className="border-t border-gray-200 pt-4 mb-6">
                          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                            Donor Information
                          </p>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                              {donation.donor?.name?.charAt(0).toUpperCase() ||
                                '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">
                                {donation.donor?.name || 'Unknown Donor'}
                              </p>
                              <div className="space-y-1 mt-1 text-xs text-gray-600">
                                {donation.donor?.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-3 h-3" />
                                    {donation.donor.phone}
                                  </div>
                                )}
                                {donation.location?.address && (
                                  <div className="flex items-start gap-2">
                                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span className="truncate">
                                      {donation.location.address}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Button - Verify OTP */}
                        {donation.status === 'assigned_to_volunteer' && (
                          <Button
                            variant="primary"
                            size="md"
                            fullWidth
                            onClick={() => handleVerifyOTP(donation._id)}
                            icon={CheckCircle}
                          >
                            🔐 Verify OTP
                          </Button>
                        )}
                      </div>
                    </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* My Assignments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">My Assignments</h2>
            <p className="text-sm text-gray-500 mt-1">Track your accepted donation deliveries</p>
          </div>
          
          {myAssignments.length === 0 ? (
            <EmptyState
              message="Accept donations from the available list to get started"
              icon="📦"
            />
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {myAssignments.map((assignment) => (
                  <motion.div
                    key={assignment._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="overflow-hidden hover" variant="gradient" hover>
                      <div className="p-6">
                        {/* Header - Status and Food Type */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <StatusBadge status={assignment.status} size="md" />
                            <h3 className="font-semibold text-lg text-gray-900 capitalize">
                              {assignment.foodType}
                            </h3>
                          </div>
                          <div className="text-3xl">
                            {assignment.foodType === 'vegetarian'
                              ? '🥗'
                              : assignment.foodType === 'non-vegetarian'
                              ? '🍖'
                              : '🍽️'}
                          </div>
                        </div>

                        {/* Food & Schedule Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          {/* Food Details */}
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Food Details
                            </p>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Quantity</span>
                                <Badge variant="primary" size="sm">
                                  {assignment.quantity} {assignment.unit}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-700 line-clamp-2">
                                {assignment.description}
                              </p>
                            </div>
                          </div>

                          {/* Schedule & Location */}
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              Schedule & Location
                            </p>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                              <div className="flex items-start gap-2 text-sm">
                                <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-gray-600">Pickup</p>
                                  <p className="font-medium text-gray-900 text-xs">
                                    {new Date(assignment.pickupTime).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-gray-600">Address</p>
                                  <p className="font-medium text-gray-900 text-xs truncate">
                                    {assignment.location?.address || 'No Address Available'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Donor Info Section */}
                        <div className="border-t border-gray-200 pt-4 mb-6">
                          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
                            Donor Information
                          </p>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                              {assignment.donor?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">
                                {assignment.donor?.name || 'Unknown Donor'}
                              </p>
                              {assignment.donor?.phone && (
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                  <Phone className="w-3 h-3" />
                                  {assignment.donor.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          {assignment.status === 'picked_up' && (
                            <>
                              {!assignment.pickupOTPVerified && (
                                <Button
                                  variant="primary"
                                  size="md"
                                  fullWidth
                                  onClick={() => handleVerifyOTP(assignment._id)}
                                  icon={CheckCircle}
                                >
                                  Verify OTP
                                </Button>
                              )}
                              {assignment.pickupOTPVerified && (
                                <Button
                                  variant="primary"
                                  size="md"
                                  fullWidth
                                  onClick={() => handleUpdateStatus(assignment._id, 'awaiting_ngo_confirmation')}
                                  icon={Truck}
                                >
                                  Mark Delivered
                                </Button>
                              )}
                            </>
                          )}
                          {assignment.status === 'awaiting_ngo_confirmation' && (
                            <div className="w-full py-2.5 px-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center gap-2">
                              <AlertCircle className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-700">
                                Awaiting NGO Confirmation
                              </span>
                            </div>
                          )}
                          {assignment.status === 'completed' && (
                            <div className="w-full py-2.5 px-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700">
                                Completed ✓
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Calendar Integration */}
        {myAssignments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <CalendarIntegration 
                donation={myAssignments[0]}
                volunteerSchedule={assignedDonations}
              />
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Completed Pickups</p>
                        <p className="text-xl font-bold text-gray-900">{completedDonations.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Pending Pickups</p>
                        <p className="text-xl font-bold text-gray-900">{assignedDonations.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Active Status</p>
                        <p className="text-xl font-bold text-gray-900">Available</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback Analytics Section */}
              <FeedbackAnalytics userId={user?._id} feedbackType="ngo-to-volunteer" />
            </div>
          </motion.div>
        )}
      </main>

      {/* Image Modal */}
      <ImageModal
        isOpen={isModalOpen}
        onClose={closeImageModal}
        imageSrc={selectedImage?.src}
        altText={selectedImage?.alt}
      />

      {/* OTP Verification Modal */}
      {otpModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              🔐 Verify Pickup OTP
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Enter the 6-digit OTP from the donor to verify pickup
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OTP Code
              </label>
              <input
                type="text"
                maxLength="6"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-lg tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={otpVerifying}
              />
              <p className="text-xs text-gray-500 mt-2">
                Only numbers. Expires in 30 minutes.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setOtpModalOpen(false);
                  setOtpValue('');
                  setOtpDonationId(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
                disabled={otpVerifying}
              >
                Cancel
              </button>
              <button
                onClick={submitOTPVerification}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                disabled={otpVerifying || !otpValue}
              >
                {otpVerifying ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Profile Edit Modal */}
      <ProfileEdit
        isOpen={profileEditOpen}
        user={user}
        onClose={() => setProfileEditOpen(false)}
        onSuccess={(updatedUser) => {
          updateUser(updatedUser);
        }}
      />
    </div>
  );
};

export default VolunteerDashboard;
