import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AdminDashboard from '../components/AdminDashboard';
import SocialShare from '../components/SocialShare';
import CalendarIntegration from '../components/CalendarIntegration';

const DemoDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [demoData, setDemoData] = useState({
    donations: [],
    volunteers: [],
    ngoLocation: { lat: 28.6139, lng: 77.2090 }
  });

  // Generate demo data
  useEffect(() => {
    generateDemoData();
  }, []);

  const generateDemoData = () => {
    // Sample donations within 5km of NGO
    const sampleDonations = [
      {
        _id: '1',
        foodType: 'Rice & Curry',
        quantity: '5kg',
        description: 'Fresh homemade rice and curry, enough for 10 people',
        donorName: 'Raj Sharma',
        donorPhone: '+919876543210',
        address: '123 Main Street, Delhi',
        location: { lat: 28.6150, lng: 77.2100 },
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        pickupDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        instructions: 'Please bring containers for packaging'
      },
      {
        _id: '2',
        foodType: 'Vegetables',
        quantity: '3kg',
        description: 'Fresh vegetables including tomatoes, onions, and potatoes',
        donorName: 'Priya Patel',
        donorPhone: '+919876543211',
        address: '456 Park Avenue, Delhi',
        location: { lat: 28.6120, lng: 77.2080 },
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        pickupDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        instructions: 'Perishable items, please pickup ASAP'
      },
      {
        _id: '3',
        foodType: 'Bread & Bakery',
        quantity: '2 dozen',
        description: 'Fresh bread and pastries from local bakery',
        donorName: 'Amit Kumar',
        donorPhone: '+919876543212',
        address: '789 Market Road, Delhi',
        location: { lat: 28.6145, lng: 77.2115 },
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        pickupDate: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
        instructions: 'Best before tomorrow'
      },
      {
        _id: '4',
        foodType: 'Cooked Meals',
        quantity: '8 meals',
        description: 'Complete meals with dal, roti, and sabzi',
        donorName: 'Sneha Reddy',
        donorPhone: '+919876543213',
        address: '321 Colony Lane, Delhi',
        location: { lat: 28.6130, lng: 77.2075 },
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        pickupDate: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        instructions: 'URGENT: Food will spoil soon!'
      }
    ];

    // Sample volunteers within 5km
    const sampleVolunteers = [
      {
        _id: 'v1',
        name: 'Rahul Verma',
        phone: '+919876543214',
        location: { lat: 28.6140, lng: 77.2095 },
        isAvailable: true,
        rating: 4.8,
        completedPickups: 23
      },
      {
        _id: 'v2',
        name: 'Anjali Singh',
        phone: '+919876543215',
        location: { lat: 28.6125, lng: 77.2085 },
        isAvailable: true,
        rating: 4.9,
        completedPickups: 31
      },
      {
        _id: 'v3',
        name: 'Vikram Mehta',
        phone: '+919876543216',
        location: { lat: 28.6155, lng: 77.2105 },
        isAvailable: false,
        rating: 4.7,
        completedPickups: 18
      },
      {
        _id: 'v4',
        name: 'Kavita Nair',
        phone: '+919876543217',
        location: { lat: 28.6135, lng: 77.2070 },
        isAvailable: true,
        rating: 5.0,
        completedPickups: 42
      }
    ];

    setDemoData({
      donations: sampleDonations,
      volunteers: sampleVolunteers,
      ngoLocation: { lat: 28.6139, lng: 77.2090 }
    });
  };

  const tabs = [
    { id: 'dashboard', name: 'Live Dashboard', icon: '📊' },
    { id: 'share', name: 'Social Share', icon: '📱' },
    { id: 'calendar', name: 'Calendar', icon: '📅' },
    { id: 'payment', name: 'Payment', icon: '💳' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ANNASETU Demo</h1>
                <p className="text-sm text-gray-600">Single NGO Local Donation System</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                Live Demo
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                5km Radius
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'dashboard' && (
            <AdminDashboard />
          )}

          {activeTab === 'share' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SocialShare 
                donation={demoData.donations[0]} 
                impact={{ mealsSaved: 156, co2Reduced: 23.4 }}
                shareType="donation"
              />
              <SocialShare 
                donation={demoData.donations[1]} 
                impact={{ mealsSaved: 89, co2Reduced: 13.2 }}
                shareType="impact"
              />
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CalendarIntegration 
                donation={demoData.donations[0]}
                volunteerSchedule={demoData.volunteers}
              />
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Calendar Events</h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-blue-900">Food Pickup - Rice & Curry</h4>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">In 2 hours</span>
                    </div>
                    <p className="text-sm text-blue-700">123 Main Street, Delhi</p>
                    <p className="text-xs text-blue-600 mt-1">Volunteer: Rahul Verma</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-orange-900">URGENT Pickup - Cooked Meals</h4>
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">In 30 mins</span>
                    </div>
                    <p className="text-sm text-orange-700">321 Colony Lane, Delhi</p>
                    <p className="text-xs text-orange-600 mt-1">Volunteer Needed!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Payment Gateway</h3>
                <p className="text-gray-600 mb-4">
                  This would integrate with Razorpay/PayTM for actual payments. For demo purposes, 
                  this shows the payment interface design.
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Demo Donation Amount:</span>
                      <span className="font-bold text-gray-900">₹500</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Fee:</span>
                      <span className="text-green-600">FREE</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-900">Total:</span>
                        <span className="text-xl font-bold text-blue-600">₹500</span>
                      </div>
                    </div>
                  </div>
                  <button className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-lg">
                    💳 Proceed to Payment (Demo)
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Features</h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Razorpay Integration</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">PayTM Support</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Multiple Payment Methods</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Secure SSL Encryption</span>
                  </li>
                  <li className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">Automatic Receipts</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Demo Info Footer */}
      <div className="bg-blue-50 border-t">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-blue-800">
                📍 NGO Location: Delhi (28.6139, 77.2090)
              </span>
              <span className="text-sm text-blue-800">
                📏 Coverage: 5km radius
              </span>
              <span className="text-sm text-blue-800">
                🍱 Active Donations: {demoData.donations.length}
              </span>
              <span className="text-sm text-blue-800">
                🚚 Available Volunteers: {demoData.volunteers.filter(v => v.isAvailable).length}
              </span>
            </div>
            <button
              onClick={generateDemoData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              🔄 Refresh Demo Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoDashboard;
