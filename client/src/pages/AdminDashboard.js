import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, LogOut, User, AlertCircle, TrendingUp, Building2, Zap, Globe, ChevronDown, Search, Filter, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileEdit from '../components/ProfileEdit';
import AdminMapEnhanced from '../components/AdminMapEnhanced';
import SocialShare from '../components/SocialShare';
import CalendarIntegration from '../components/CalendarIntegration';
import Logo from '../components/Logo';
import { StatusBadge, Button } from '../components/ui';
import { filterDonationsWithinRadius, calculateDistance } from '../utils/donationUtils';
import API_BASE_URL from '../config/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [ngoModalOpen, setNGOModalOpen] = useState(false);
  const [ngoSearchTerm, setNGOSearchTerm] = useState('');
  const [ngoFilterStatus, setNGOFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalDonations: 0,
    activeVolunteers: 0,
    mealsSaved: 0,
    co2Reduced: 0,
    todayDonations: 0,
    pendingPickups: 0,
    connectedNGOs: 0
  });
  const [donations, setDonations] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [ngos, setNGOs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logout, user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Separate state for recent donations (not urgent)
  const [recentDonations, setRecentDonations] = useState([]);

  // NGO location - Real Santulan Bhavan, Pune coordinates (wrapped in useMemo to prevent dependency warnings)
  const ngoLocation = useMemo(() => ({ lat: 18.5645039, lng: 73.9459615 }), []); // Santulan Bhavan, Kharadi, Pune

  // Filter donations within 5km (all active statuses, not just urgent)
  const getNearbyDonations = useCallback(() => {
    const allNearby = filterDonationsWithinRadius(donations, ngoLocation.lat, ngoLocation.lng, 5);
    
    // Filter for ACTIVE donations (any status except completed or cancelled)
    const activeDonations = allNearby.filter(d =>
      ['pending', 'accepted_by_ngo', 'assigned_to_volunteer', 'picked_up'].includes(d.status)
    );
    
    console.log('All nearby donations:', allNearby.length);
    console.log('Active nearby donations:', activeDonations.length);
    console.log('Active donations breakdown:', {
      pending: allNearby.filter(d => d.status === 'pending').length,
      accepted_by_ngo: allNearby.filter(d => d.status === 'accepted_by_ngo').length,
      assigned_to_volunteer: allNearby.filter(d => d.status === 'assigned_to_volunteer').length,
      picked_up: allNearby.filter(d => d.status === 'picked_up').length,
      completed: allNearby.filter(d => d.status === 'completed').length,
      cancelled: allNearby.filter(d => d.status === 'cancelled').length
    });
    
    return activeDonations;
  }, [donations, ngoLocation]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      console.log('Fetching admin dashboard data...');
      
      // Create timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        const [statsRes, donationsRes, volunteersRes, mapDataRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/admin/dashboard`, { ...config, signal: controller.signal }),
          axios.get(`${API_BASE_URL}/api/admin/donations`, { ...config, signal: controller.signal }),
          axios.get(`${API_BASE_URL}/api/admin/users`, { ...config, signal: controller.signal }),
          axios.get(`${API_BASE_URL}/api/admin/map-data`, { ...config, signal: controller.signal })
        ]);

        clearTimeout(timeoutId);

        console.log('Dashboard API responses:', {
          stats: statsRes.data,
          donations: donationsRes.data,
          volunteers: volunteersRes.data,
          mapData: mapDataRes.data
        });

        // Calculate real stats from actual data
        const realDonations = donationsRes.data?.donations || [];
        const realVolunteers = volunteersRes.data?.users?.filter(u => u.role === 'volunteer') || [];
        const mapData = mapDataRes.data || {};
        const realNGOs = mapData.ngos || [];
        
        // Filter nearby donations (within 5km)
        const nearbyDonations = filterDonationsWithinRadius(realDonations, ngoLocation.lat, ngoLocation.lng, 5);
        
        // Set recent donations (all nearby, not just urgent)
        setRecentDonations(nearbyDonations);
        setNGOs(realNGOs);
        
        const calculatedStats = {
          totalDonations: realDonations.length,
          activeVolunteers: realVolunteers.filter(v => v.isAvailable).length,
          mealsSaved: realDonations.filter(d => d.status === 'completed').length * 4,
          co2Reduced: realDonations.filter(d => d.status === 'completed').length * 2.5,
          todayDonations: realDonations.filter(d => {
            const today = new Date();
            const donationDate = new Date(d.createdAt);
            return donationDate.toDateString() === today.toDateString();
          }).length,
          pendingPickups: realDonations.filter(d => d.status === 'pending').length,
          connectedNGOs: realNGOs.filter(ngo => ngo.approvalStatus === 'approved').length
        };
        
        setStats(calculatedStats);
        setDonations(realDonations);
        setVolunteers(realVolunteers);
        
        console.log('Real data loaded successfully');
        console.log('Calculated stats:', calculatedStats);
        console.log('Donations count:', realDonations.length);
        console.log('Recent donations count:', nearbyDonations.length);
        console.log('Volunteers count:', realVolunteers.length);
      } catch (timeoutErr) {
        clearTimeout(timeoutId);
        throw timeoutErr;
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error.response?.data || error.message);
      
      // Handle timeout specifically
      if (error.code === 'ECONNABORTED') {
        console.log('Request timeout');
        alert('Request timeout - server may be slow. Please try again.');
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Authentication error - redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      } else {
        alert('Failed to load dashboard data. Please check your connection and try again.');
      }
      
      // Ensure state is reset on error
      setStats({
        totalDonations: 0,
        activeVolunteers: 0,
        mealsSaved: 0,
        co2Reduced: 0,
        todayDonations: 0,
        pendingPickups: 0,
        connectedNGOs: 0
      });
      setDonations([]);
      setVolunteers([]);
      setNGOs([]);
      setRecentDonations([]);
    } finally {
      setLoading(false);
    }
  }, [ngoLocation]);

  useEffect(() => {
    fetchDashboardData();
    // Remove auto-refresh for demo mode to prevent data loss
    // const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds
    // return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleViewUrgentDonations = () => {
    console.log('View Details clicked - navigating to urgent donations');
    navigate('/admin/urgent-donations');
  };

  const activeDonationsNearby = getNearbyDonations();
  
  // Extract urgent donations from active nearby donations (pending status + within 2 hours of pickup)
  const urgentDonations = activeDonationsNearby.filter(d => 
    d.status === 'pending' &&
    d.pickupTime &&
    (new Date(d.pickupTime) - Date.now()) / (1000 * 60) <= 120 && // Within 2 hours
    (new Date(d.pickupTime) - Date.now()) / (1000 * 60) > 0 // Pickup time in future
  );

  // Debug logging
  console.log('Dashboard state:', {
    totalDonations: donations.length,
    activeDonationsNearby: activeDonationsNearby.length,
    urgentDonations: urgentDonations.length,
    ngoLocation: ngoLocation
  });

  const tabs = [
    { id: 'dashboard', name: 'Live Dashboard', icon: '📊' },
    { id: 'map', name: '5km Map', icon: '🗺️' },
    { id: 'ngos', name: 'NGO Approvals', icon: '🏢' },
    { id: 'share', name: 'Share Impact', icon: '📱' },
    { id: 'calendar', name: 'Calendar', icon: '📅' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-emerald-50">
      {/* Modern Header with Glassmorphism */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-emerald-100/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-5">
            <motion.div 
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Logo size="medium" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                  AnnaSetu Control Center
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">Real-time Food Donation Ecosystem Monitoring</p>
              </div>
            </motion.div>
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-emerald-50 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-2 border border-emerald-200 backdrop-blur">
                <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></span>
                Live Monitoring
              </span>
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
            </motion.div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs - Modern Tab Design */}
      <div className="bg-white/40 backdrop-blur-md border-b border-emerald-100/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab, idx) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                className={`px-4 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                    : 'border-transparent text-gray-600 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                {tab.name}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Urgent Alert */}
              <AnimatePresence>
                {urgentDonations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-xl p-6 shadow-sm backdrop-blur border border-orange-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <motion.div 
                          className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0"
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <AlertCircle className="w-6 h-6 text-orange-600" />
                        </motion.div>
                        <div>
                          <h3 className="text-lg font-semibold text-orange-900">Urgent Pickups Required</h3>
                          <p className="text-sm text-orange-700 mt-0.5">
                            {urgentDonations.length} donation(s) need immediate pickup within 5km
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="danger"
                        size="md"
                        onClick={handleViewUrgentDonations}
                      >
                        View Details
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Enhanced Stats Cards Grid */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
              >
                <LightAnimatedStatCard
                  icon={AlertCircle}
                  label="Total Donations"
                  value={stats.totalDonations}
                  subtitle="Across platform"
                  gradient="from-blue-50 to-cyan-50"
                  borderColor="border-blue-200"
                  textColor="text-blue-700"
                />
                <LightAnimatedStatCard
                  icon={Users}
                  label="Active Volunteers"
                  value={stats.activeVolunteers}
                  subtitle="Ready for pickup"
                  gradient="from-emerald-50 to-teal-50"
                  borderColor="border-emerald-200"
                  textColor="text-emerald-700"
                />
                <LightAnimatedStatCard
                  icon={Building2}
                  label="Connected NGOs"
                  value={stats.connectedNGOs}
                  subtitle="Approved partners"
                  gradient="from-amber-50 to-orange-50"
                  borderColor="border-amber-200"
                  textColor="text-amber-700"
                  onClick={() => setNGOModalOpen(true)}
                />
                <LightAnimatedStatCard
                  icon={Zap}
                  label="Meals Saved"
                  value={stats.mealsSaved}
                  subtitle="Lives impacted"
                  gradient="from-pink-50 to-rose-50"
                  borderColor="border-pink-200"
                  textColor="text-pink-700"
                />
              </motion.div>

              {/* Secondary Metrics */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <LightMetricCard
                  title="Today's Donations"
                  value={stats.todayDonations}
                  icon="🍱"
                  bgGradient="from-blue-50 to-cyan-50"
                  borderColor="border-blue-200"
                />
                <LightMetricCard
                  title="Pending Pickups"
                  value={stats.pendingPickups}
                  icon="⏳"
                  bgGradient="from-orange-50 to-red-50"
                  borderColor="border-orange-200"
                />
                <LightMetricCard
                  title="CO₂ Reduced (kg)"
                  value={Math.round(stats.co2Reduced)}
                  icon="🌍"
                  bgGradient="from-green-50 to-emerald-50"
                  borderColor="border-green-200"
                />
              </motion.div>

              {/* Recent Donations & Volunteers Grid */}
              <motion.div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {/* Recent Donations Card */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-emerald-100/50 overflow-hidden hover:shadow-md transition-all">
                  <div className="p-6 border-b border-emerald-100/30 bg-gradient-to-r from-blue-50/50 to-emerald-50/50">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-emerald-600" />
                      Recent Donations
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Nearby locations</p>
                  </div>
                  {recentDonations.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-gray-500">No donations nearby</p>
                    </div>
                  ) : (
                    <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                      {recentDonations.slice(0, 5).map((donation, idx) => (
                        <motion.div
                          key={donation._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="border border-emerald-100 rounded-xl p-4 hover:bg-emerald-50/40 transition-colors bg-white/50 backdrop-blur-sm"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900 capitalize">{donation.foodType}</h4>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {donation.quantity} {donation.unit}
                              </p>
                            </div>
                            <StatusBadge status={donation.status} size="sm" />
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-3">{donation.description}</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-blue-50/50 rounded p-2 border border-blue-100">
                              <p className="text-gray-600">Donor</p>
                              <p className="text-gray-900 font-medium">{donation.donor?.name}</p>
                            </div>
                            <div className="bg-emerald-50/50 rounded p-2 border border-emerald-100">
                              <p className="text-gray-600">Distance</p>
                              <p className="text-gray-900 font-medium">
                                {donation.location?.coordinates 
                                  ? calculateDistance(ngoLocation.lat, ngoLocation.lng, donation.location.coordinates[1], donation.location.coordinates[0]).toFixed(1)
                                  : '0'} km
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Available Volunteers Card */}
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm border border-emerald-100/50 overflow-hidden hover:shadow-md transition-all">
                  <div className="p-6 border-b border-emerald-100/30 bg-gradient-to-r from-blue-50/50 to-emerald-50/50">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-600" />
                      Available Volunteers
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Ready for assignments</p>
                  </div>
                  {volunteers.filter(v => v.isAvailable).length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-gray-500">No volunteers available</p>
                    </div>
                  ) : (
                    <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                      {volunteers.filter(v => v.isAvailable).slice(0, 5).map((volunteer, idx) => (
                        <motion.div
                          key={volunteer._id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="border border-emerald-100 rounded-xl p-4 hover:bg-emerald-50/40 transition-colors bg-white/50 backdrop-blur-sm"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-white">
                                  {volunteer.name?.charAt(0).toUpperCase() || '?'}
                                </span>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">{volunteer.name}</h4>
                                <p className="text-xs text-gray-600">⭐ {volunteer.rating || '4.5'}</p>
                              </div>
                            </div>
                            <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full font-medium border border-emerald-200">
                              Available
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1 bg-blue-50/40 rounded p-3 border border-blue-100">
                            <p>📱 {volunteer.phone}</p>
                            <p>🚗 {volunteer.vehicle || 'N/A'}</p>
                            <p>
                              {volunteer.location?.coordinates 
                                ? calculateDistance(ngoLocation.lat, ngoLocation.lng, volunteer.location.coordinates[1], volunteer.location.coordinates[0]).toFixed(1)
                                : '0'} km away · ✅ {volunteer.completedPickups || 0} pickups
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === 'map' && (
            <AdminMapEnhanced
              ngos={ngos}
              donations={donations}
              volunteers={volunteers}
            />
          )}

          {activeTab === 'ngos' && (
            <NGOApprovalPanel />
          )}

          {activeTab === 'share' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SocialShare 
                donation={activeDonationsNearby[0] || { _id: 'demo', foodType: 'Mixed Food' }} 
                impact={{ mealsSaved: stats.mealsSaved, co2Reduced: stats.co2Reduced }}
                shareType="donation"
              />
              <SocialShare 
                donation={activeDonationsNearby[1] || { _id: 'demo', foodType: 'Vegetables' }} 
                impact={{ mealsSaved: Math.floor(stats.mealsSaved * 0.7), co2Reduced: stats.co2Reduced * 0.7 }}
                shareType="impact"
              />
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CalendarIntegration 
                donation={activeDonationsNearby[0] || { 
                  _id: 'demo', 
                  foodType: 'Rice & Curry',
                  pickupDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
                  address: '123 Main Street, Delhi',
                  donorName: 'Raj Sharma',
                  donorPhone: '+919876543210'
                }}
                volunteerSchedule={volunteers}
              />
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Pickups</h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-900">Food Pickup - Rice & Curry</h4>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">In 2 hours</span>
                    </div>
                    <p className="text-sm text-blue-700">123 Main Street, Delhi</p>
                    <p className="text-xs text-blue-600 mt-1">Volunteer: Rahul Verma</p>
                  </div>
                  {urgentDonations.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-orange-900">URGENT Pickup</h4>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">ASAP</span>
                      </div>
                      <p className="text-sm text-orange-700">Multiple locations within 5km</p>
                      <p className="text-xs text-orange-600 mt-1">Volunteers needed!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* NGO Management Modal */}
      <LightNGOManagementModal
        isOpen={ngoModalOpen}
        onClose={() => setNGOModalOpen(false)}
        ngos={ngos}
        searchTerm={ngoSearchTerm}
        onSearchChange={setNGOSearchTerm}
        filterStatus={ngoFilterStatus}
        onFilterChange={setNGOFilterStatus}
      />

      {/* Footer Info */}
      <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border-t border-emerald-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-700">
                📍 <strong>Santulan Bhavan, Pune</strong> (18.5645039, 73.9459615)
              </span>
              <span className="text-gray-700">
                📏 <strong>5km Coverage</strong>
              </span>
              <span className="text-gray-700">
                🍱 <strong>{activeDonationsNearby.length}</strong> Active Donations
              </span>
              <span className="text-gray-700">
                🚚 <strong>{volunteers.filter(v => v.isAvailable).length}</strong> Available Volunteers
              </span>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                console.log('Refreshing data...');
                fetchDashboardData();
              }}
            >
              🔄 Refresh Data
            </Button>
          </div>
        </div>
      </div>

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

// ─── Helper Components ────────────────────────────────────────────────────────

// Animated Stat Card with light theme styling
const LightAnimatedStatCard = ({ icon: Icon, label, value, subtitle, gradient, borderColor, textColor, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`group cursor-pointer relative bg-gradient-to-br ${gradient} border ${borderColor} rounded-xl p-6 shadow-sm hover:shadow-md transition-all`}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent"></div>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2 bg-white rounded-lg group-hover:bg-white transition-colors`}>
            <Icon className={`w-5 h-5 ${textColor}`} />
          </div>
          <TrendingUp className={`w-4 h-4 ${textColor} opacity-50 group-hover:opacity-100 transition-opacity`} />
        </div>
        
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{label}</p>
          <motion.p 
            className={`text-4xl font-bold ${textColor}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {value}
          </motion.p>
          <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
};

// Simple metric card for light theme
const LightMetricCard = ({ title, value, icon, bgGradient, borderColor }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`bg-gradient-to-br ${bgGradient} border ${borderColor} rounded-xl p-6 shadow-sm hover:shadow-md transition-all`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-4xl opacity-50">{icon}</div>
      </div>
    </motion.div>
  );
};

// NGO Modal Component - Light theme
const LightNGOManagementModal = ({ isOpen, onClose, ngos, searchTerm, onSearchChange, filterStatus, onFilterChange }) => {
  const filteredNGOs = ngos.filter(ngo => {
    const matchesSearch = ngo.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ngo.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ngo.approvalStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col border border-gray-200 shadow-xl"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-emerald-100 bg-gradient-to-r from-blue-50 to-emerald-50 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-emerald-600" />
                  Connected NGOs
                </h2>
                <p className="text-gray-600 text-sm mt-1">{filteredNGOs.length} organization(s)</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Search and Filter */}
            <div className="p-6 border-b border-emerald-100 space-y-4 bg-white/50">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-blue-50/30 border border-emerald-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => onFilterChange(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-blue-50/30 border border-emerald-200 rounded-xl text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* NGO List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white/30 to-blue-50/30">
              {filteredNGOs.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No NGOs found</p>
                </div>
              ) : (
                filteredNGOs.map((ngo, idx) => (
                  <LightNGOCard key={ngo._id} ngo={ngo} index={idx} />
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// NGO Card Component - Light theme
const LightNGOCard = ({ ngo, index }) => {
  const [expanded, setExpanded] = React.useState(false);

  const statusColors = {
    approved: 'from-emerald-50 to-teal-50 border-emerald-200',
    pending: 'from-blue-50 to-cyan-50 border-blue-200',
    rejected: 'from-orange-50 to-red-50 border-orange-200'
  };

  const statusBadgeColors = {
    approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    pending: 'bg-blue-100 text-blue-800 border-blue-200',
    rejected: 'bg-orange-100 text-orange-800 border-orange-200'
  };

  // Generate registration number if not provided
  const registrationNumber = ngo.registrationNumber || `NGO-${ngo._id?.toString().substring(0, 6).toUpperCase() || 'UNKNOWN'}`;
  
  // Format address: use location.address if available, otherwise just address field
  const displayAddress = ngo.location?.address || ngo.address || 'Location not set';
  
  // Format joined date
  const joinedDate = ngo.createdAt 
    ? new Date(ngo.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'N/A';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="overflow-hidden"
    >
      <div
        onClick={() => setExpanded(!expanded)}
        className={`bg-gradient-to-br ${statusColors[ngo.approvalStatus] || statusColors.pending} border rounded-xl p-6 cursor-pointer transition-all hover:shadow-md backdrop-blur-sm`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg shadow-sm">
              {ngo.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{ngo.name}</h3>
              <p className="text-xs text-gray-600 font-mono mb-1">{registrationNumber}</p>
              <p className="text-sm text-gray-600 truncate">{ngo.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded-full border ${statusBadgeColors[ngo.approvalStatus] || statusBadgeColors.pending}`}>
                  {ngo.approvalStatus?.charAt(0).toUpperCase() + ngo.approvalStatus?.slice(1)}
                </span>
                {displayAddress !== 'Location not set' && (
                  <span className="text-xs text-gray-600">
                    📍 {displayAddress}
                  </span>
                )}
              </div>
            </div>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0 mt-1"
          >
            <ChevronDown className="w-5 h-5 text-gray-600" />
          </motion.div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-emerald-100 space-y-3"
            >
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-gray-600 text-xs font-medium mb-1">Phone</p>
                  <p className="text-gray-900 font-medium">{ngo.phone || 'N/A'}</p>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-gray-600 text-xs font-medium mb-1">Coverage Radius</p>
                  <p className="text-gray-900 font-medium">{ngo.coverageRadius || '5'} km</p>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-gray-600 text-xs font-medium mb-1">Total Volunteers</p>
                  <p className="text-gray-900 font-medium">{ngo.volunteerCount || '0'}</p>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-gray-600 text-xs font-medium mb-1">Donations Received</p>
                  <p className="text-gray-900 font-medium">{ngo.donationCount || '0'}</p>
                </div>
                <div className="bg-white/50 rounded-lg p-3 col-span-2">
                  <p className="text-gray-600 text-xs font-medium mb-1">Address</p>
                  <p className="text-gray-900 font-medium text-xs">{displayAddress}</p>
                </div>
                <div className="bg-white/50 rounded-lg p-3">
                  <p className="text-gray-600 text-xs font-medium mb-1">Joined</p>
                  <p className="text-gray-900 font-medium">{joinedDate}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;

// ─── NGOApprovalPanel ─────────────────────────────────────────────────────────
// Self-contained component rendered inside the Admin Dashboard's "NGO Approvals"
// tab. Fetches NGO lists independently so it doesn't affect the main dashboard
// data flow or loading states.

const API_BASE = API_BASE_URL;

const NGOApprovalPanel = () => {
  const [filter, setFilter]       = React.useState('pending');
  const [ngos, setNgos]           = React.useState([]);
  const [panelLoading, setLoading] = React.useState(true);
  const [rejectModal, setRejectModal] = React.useState(null); // { id, name }
  const [rejectNote, setRejectNote]   = React.useState('');
  const [acting, setActing]       = React.useState(false);
  const [msg, setMsg]             = React.useState(null); // { text, type }

  const authCfg = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchNgos = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/api/admin/ngos?status=${filter}`,
        authCfg()
      );
      setNgos(res.data);
    } catch (e) {
      setMsg({ text: 'Failed to load NGOs.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => { fetchNgos(); }, [fetchNgos]);

  const handleApprove = async (id, name) => {
    setActing(true);
    try {
      await axios.patch(`${API_BASE}/api/admin/ngos/${id}/approve`, {}, authCfg());
      setMsg({ text: `"${name}" approved successfully.`, type: 'success' });
      fetchNgos();
    } catch (e) {
      setMsg({ text: e.response?.data?.message || 'Approval failed.', type: 'error' });
    } finally {
      setActing(false);
    }
  };

  const handleRejectSubmit = async () => {
    setActing(true);
    try {
      await axios.patch(
        `${API_BASE}/api/admin/ngos/${rejectModal.id}/reject`,
        { note: rejectNote },
        authCfg()
      );
      setMsg({ text: `"${rejectModal.name}" rejected.`, type: 'success' });
      setRejectModal(null);
      setRejectNote('');
      fetchNgos();
    } catch (e) {
      setMsg({ text: e.response?.data?.message || 'Rejection failed.', type: 'error' });
    } finally {
      setActing(false);
    }
  };

  const STATUS_COUNT_STYLE = {
    pending:  'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100  text-red-700',
  };

  return (
    <div className="space-y-6">
      {/* Header + filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">NGO Approval Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Review and approve NGO registrations</p>
        </div>
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors border ${
                filter === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Flash message */}
      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between ${
          msg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="ml-4 opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Table */}
      {panelLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full" />
        </div>
      ) : ngos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center">
          <div className="text-4xl mb-3">🏢</div>
          <p className="text-gray-500">No {filter} NGOs found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['NGO Name', 'Email', 'Phone', 'Registered', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {ngos.map(ngo => (
                <tr key={ngo._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">{ngo.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">
                      {ngo.location?.address || '—'}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{ngo.email}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{ngo.phone}</td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {new Date(ngo.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COUNT_STYLE[ngo.approvalStatus]}`}>
                      {ngo.approvalStatus}
                    </span>
                    {ngo.approvalStatus === 'rejected' && ngo.approvalNote && (
                      <p className="text-xs text-gray-400 mt-1 max-w-[140px] truncate" title={ngo.approvalNote}>
                        Note: {ngo.approvalNote}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      {ngo.approvalStatus !== 'approved' && (
                        <button
                          onClick={() => handleApprove(ngo._id, ngo.name)}
                          disabled={acting}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      {ngo.approvalStatus !== 'rejected' && (
                        <button
                          onClick={() => { setRejectModal({ id: ngo._id, name: ngo.name }); setRejectNote(''); }}
                          disabled={acting}
                          className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setRejectModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-1">Reject NGO</h3>
            <p className="text-sm text-gray-500 mb-5">
              Rejecting: <strong className="text-gray-800">{rejectModal.name}</strong>
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason (optional)
            </label>
            <textarea
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              rows={3}
              placeholder="Provide a reason visible to the NGO…"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={acting}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {acting ? 'Rejecting…' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
