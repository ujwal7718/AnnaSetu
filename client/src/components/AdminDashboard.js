import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import DonationMap from './DonationMap';
import RealTimeNotifications from './RealTimeNotifications';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalDonations: 0,
    activeVolunteers: 0,
    mealsSaved: 0,
    co2Reduced: 0,
    todayDonations: 0,
    pendingPickups: 0
  });

  const [donations, setDonations] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');

  // NGO location (you can get this from your backend) - wrapped in useMemo
  const ngoLocation = useMemo(() => ({ 
    lat: 28.6139, 
    lng: 77.2090 
  }), []); // Delhi example

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const fetchDashboardData = async () => {
    try {
      // Replace with your actual API calls
      const [donationsRes, volunteersRes, statsRes] = await Promise.all([
        fetch('/api/donations').then(res => res.json()),
        fetch('/api/volunteers').then(res => res.json()),
        fetch('/api/admin/stats').then(res => res.json())
      ]);
      
      setDonations(donationsRes);
      setVolunteers(volunteersRes);
      setStats(statsRes);
      
      // Debug logging for volunteer consistency
      console.log('🔍 Volunteer Data Analysis:');
      console.log(`📊 Total volunteers from API: ${volunteersRes?.length || 0}`);
      console.log(`📈 Stats activeVolunteers: ${statsRes?.activeVolunteers || 0}`);
      
      // Analyze volunteer data quality
      const volunteersWithLocation = volunteersRes?.filter(v => v.location) || [];
      const volunteersWithValidLocation = volunteersRes?.filter(v => 
        v.location && 
        v.location.lat && 
        v.location.lng && 
        !isNaN(v.location.lat) && 
        !isNaN(v.location.lng)
      ) || [];
      const availableVolunteers = volunteersRes?.filter(v => v.isAvailable) || [];
      const availableWithLocation = availableVolunteers.filter(v => v.location);
      const availableWithValidLocation = availableVolunteers.filter(v => 
        v.location && 
        v.location.lat && 
        v.location.lng && 
        !isNaN(v.location.lat) && 
        !isNaN(v.location.lng)
      );
      
      console.log(`📍 Volunteers with location: ${volunteersWithLocation.length}`);
      console.log(`✅ Volunteers with valid location: ${volunteersWithValidLocation.length}`);
      console.log(`🟢 Available volunteers: ${availableVolunteers.length}`);
      console.log(`🟢 Available with location: ${availableWithLocation.length}`);
      console.log(`✅ Available with valid location: ${availableWithValidLocation.length}`);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  // Calculate distance between two points - wrapped in useCallback
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Filter donations within 5km
  const getNearbyDonations = useCallback(() => {
    return donations.filter(donation => {
      const distance = calculateDistance(
        ngoLocation.lat, ngoLocation.lng,
        donation.location.lat, donation.location.lng
      );
      return distance <= 5;
    });
  }, [donations, ngoLocation, calculateDistance]);

  const nearbyDonations = getNearbyDonations();
  const urgentDonations = nearbyDonations.filter(d => 
    (Date.now() - new Date(d.createdAt)) / (1000 * 60 * 60) < 2
  );

  // Calculate filtered volunteers for consistency
  const getFilteredVolunteers = useCallback(() => {
    const availableVolunteers = volunteers.filter(v => v.isAvailable);
    const availableWithValidLocation = availableVolunteers.filter(v => 
      v.location && 
      v.location.lat && 
      v.location.lng && 
      !isNaN(v.location.lat) && 
      !isNaN(v.location.lng)
    );
    
    // Filter by 5km radius
    const nearbyAvailableVolunteers = availableWithValidLocation.filter(volunteer => {
      const distance = calculateDistance(
        ngoLocation.lat, ngoLocation.lng,
        volunteer.location.lat, volunteer.location.lng
      );
      return distance <= 5;
    });
    
    return nearbyAvailableVolunteers;
  }, [volunteers, ngoLocation, calculateDistance]);

  const filteredVolunteers = getFilteredVolunteers();
  const totalAvailableVolunteers = volunteers.filter(v => v.isAvailable).length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">NGO Dashboard</h1>
              <p className="text-gray-600 mt-1">Real-time local donation monitoring</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Donations</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalDonations}</p>
                <p className="text-xs text-green-600 mt-2">+12% from last {selectedTimeRange}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Volunteers</p>
                <p className="text-3xl font-bold text-gray-900">{totalAvailableVolunteers}</p>
                <p className="text-xs text-blue-600 mt-2">
                  {filteredVolunteers.length} with valid location in 5km radius
                </p>
                <p className="text-xs text-green-600 mt-1">+8% from last {selectedTimeRange}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Meals Saved</p>
                <p className="text-3xl font-bold text-gray-900">{stats.mealsSaved}</p>
                <p className="text-xs text-green-600 mt-2">+15% from last {selectedTimeRange}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">CO₂ Reduced (kg)</p>
                <p className="text-3xl font-bold text-gray-900">{stats.co2Reduced}</p>
                <p className="text-xs text-green-600 mt-2">+20% from last {selectedTimeRange}</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Urgent Donations Alert */}
        {urgentDonations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-800">Urgent Pickups Required</h3>
                  <p className="text-red-600">{urgentDonations.length} donations need immediate pickup within 5km radius</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                View Details
              </button>
            </div>
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Map */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <DonationMap
              donations={nearbyDonations}
              volunteers={volunteers.filter(v => v.isAvailable)}
              ngoLocation={ngoLocation}
              radius={5}
              totalVolunteers={totalAvailableVolunteers}
              filteredVolunteers={filteredVolunteers}
            />
          </motion.div>

          {/* Recent Donations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Donations (5km radius)</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {nearbyDonations.slice(0, 10).map((donation) => (
                <div key={donation._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{donation.foodType}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      (Date.now() - new Date(donation.createdAt)) / (1000 * 60 * 60) < 2
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {(Date.now() - new Date(donation.createdAt)) / (1000 * 60 * 60) < 2 ? 'Urgent' : 'Normal'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{donation.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Quantity: {donation.quantity}</span>
                    <span>Distance: {calculateDistance(ngoLocation.lat, ngoLocation.lng, donation.location.lat, donation.location.lng).toFixed(2)}km</span>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <button className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                      Assign Volunteer
                    </button>
                    <button className="flex-1 px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Available Volunteers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Volunteers (5km radius)</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                📍 Showing <span className="font-semibold">{filteredVolunteers.length}</span> of <span className="font-semibold">{totalAvailableVolunteers}</span> volunteers 
                (only those with valid location within 5km radius)
              </p>
              {totalAvailableVolunteers > filteredVolunteers.length && (
                <p className="text-xs text-blue-600 mt-2">
                  ℹ️ {totalAvailableVolunteers - filteredVolunteers.length} volunteers missing location data or outside coverage area
                </p>
              )}
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredVolunteers.slice(0, 10).map((volunteer) => (
                <div key={volunteer._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{volunteer.name}</h4>
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Available</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{volunteer.phone}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Distance: {calculateDistance(ngoLocation.lat, ngoLocation.lng, volunteer.location.lat, volunteer.location.lng).toFixed(2)}km</span>
                    <span>Rating: ⭐ {volunteer.rating || '4.5'}</span>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <button className="flex-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                      Assign Task
                    </button>
                    <button className="flex-1 px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 transition-colors">
                      Contact
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Real-time Notifications */}
      <RealTimeNotifications />
    </div>
  );
};

export default AdminDashboard;
