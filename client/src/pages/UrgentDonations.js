import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { isUrgent, filterDonationsWithinRadius, calculateDistance } from '../utils/donationUtils';

const UrgentDonations = () => {
  const [urgentDonations, setUrgentDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  // NGO location for distance calculation (wrapped in useMemo)
  const ngoLocation = useMemo(() => ({ lat: 18.5645039, lng: 73.9459615 }), []);

  const fetchUrgentDonations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      console.log('Fetching urgent donations...');
      
      const response = await axios.get('http://localhost:5001/api/admin/donations', config);
      const allDonations = response.data?.donations || [];
      
      // Use common utility functions for consistent filtering
      const nearbyDonations = filterDonationsWithinRadius(allDonations, ngoLocation.lat, ngoLocation.lng, 5);
      const urgent = nearbyDonations.filter(isUrgent);
      
      console.log('Found urgent donations:', urgent.length);
      setUrgentDonations(urgent);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching urgent donations:', error);
      setLoading(false);
    }
  }, [ngoLocation]);

  useEffect(() => {
    fetchUrgentDonations();
  }, [fetchUrgentDonations]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Logo size="medium" />
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">Urgent Donations</h1>
                <p className="text-sm text-gray-500">Immediate pickup required within 5km radius</p>
              </div>
            </div>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-200 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4v1a3 3 0 01-3 3H7a3 3 0 01-3-3v1m6 0l-6 6m6 6v1a3 3 0 01-3 3H7a3 3 0 01-3-3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            🚨 Urgent Pickups Required
          </h2>
          <p className="text-gray-600 mb-6">
            Found {urgentDonations.length} urgent donations that need immediate pickup within 5km radius
          </p>
        </div>

        {/* Urgent Donations List */}
        <div className="space-y-4">
          {urgentDonations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">
                No urgent donations found within 5km radius
              </div>
            </div>
          ) : (
            urgentDonations.map((donation, index) => (
              <motion.div
                key={donation._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{donation.foodType}</h3>
                    <p className="text-gray-600 text-sm">{donation.quantity} {donation.unit}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Urgent
                    </span>
                  </div>
                </div>

                <p className="text-gray-700 mb-3">{donation.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Donor Information</h4>
                    <p className="text-sm text-gray-600">
                      <strong>Name:</strong> {donation.donor?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Phone:</strong> {donation.donor?.phone}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Address:</strong> {donation.address}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Pickup Information</h4>
                    <p className="text-sm text-gray-600">
                      <strong>Pickup Time:</strong> {new Date(donation.pickupTime).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Expiry:</strong> {new Date(donation.expiryDate).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Distance:</strong> {calculateDistance(ngoLocation.lat, ngoLocation.lng, donation.location.coordinates[1], donation.location.coordinates[0]).toFixed(2)} km
                    </p>
                  </div>
                </div>

                {/* Images */}
                {donation.images && donation.images.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Images</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {donation.images.map((image, imgIndex) => (
                        <img
                          key={imgIndex}
                          src={`http://localhost:5001${image}`}
                          alt={`${donation.foodType} ${imgIndex + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Contact Donor
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Assign Volunteer
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default UrgentDonations;
