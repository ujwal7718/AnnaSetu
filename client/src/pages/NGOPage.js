import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Globe, Users, Package } from 'lucide-react';
import API_BASE_URL from '../config/api';

const API_BASE = API_BASE_URL;

const NGOPage = () => {
  // Hardcoded Santulan Bhavan - always display
  const hardcodedSantulanBhavan = useMemo(() => ({
    id: 'hardcoded-santulan-1',
    name: "Santulan Bhavan",
    location: "Kharadi, Pune",
    contact: "+91 9371206750",
    email: "info@santulan.org",
    website: "www.santulan.org",
    description: "Santulan formed in 1997 as a voluntary, social, non-government organization with an integrated approach of development programs and rights-based advocacy for policy change. Santulan works towards transformation of marginalised communities and sections of Indian society.",
    mealsServed: "5000+",
    volunteers: "45+",
    established: "2012",
    isHardcoded: true
  }), []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [ngos, setNgos] = useState([hardcodedSantulanBhavan]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch NGOs from backend
  useEffect(() => {
    const fetchNgos = async () => {
      try {
        setLoading(true);
        const fetchUrl = `${API_BASE}/api/auth/approved-ngos`;
        console.log('Fetching NGOs from:', fetchUrl);
        
        const response = await fetch(fetchUrl);
        
        console.log('Response status:', response.status);
        console.log('Response URL:', response.url);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response error:', errorText);
          throw new Error(`Failed to fetch NGOs: ${response.status} ${response.statusText}`);
        }
        
        const dynamicNgos = await response.json();
        console.log('Fetched NGOs:', dynamicNgos);
        
        // Convert dynamic NGO data to match UI format
        const formattedDynamicNgos = dynamicNgos.map((ngo) => {
          // Extract location address from GeoJSON or use address field
          let locationStr = 'Location not specified';
          if (ngo.location) {
            if (typeof ngo.location === 'string') {
              locationStr = ngo.location;
            } else if (ngo.location.address) {
              locationStr = ngo.location.address;
            }
          }
          
          return {
            id: ngo._id,
            name: ngo.name,
            location: locationStr,
            contact: ngo.phone || 'Contact not available',
            email: ngo.email || 'Email not available',
            website: ngo.website || 'Website not available',
            description: ngo.description || 'Description not available',
            mealsServed: ngo.mealsServed || 'N/A',
            volunteers: ngo.volunteers || 'N/A',
            established: ngo.established || 'N/A',
            isHardcoded: false
          };
        });
        
        // Merge hardcoded Santulan Bhavan with dynamic NGOs
        // Avoid duplicates: check if Santulan is in dynamic NGOs
        const hasSantulanInDynamic = formattedDynamicNgos.some(ngo => 
          ngo.name.toLowerCase().includes('santulan')
        );
        
        if (hasSantulanInDynamic) {
          // Santulan exists in database, use only dynamic list (includes Santulan)
          setNgos(formattedDynamicNgos);
        } else {
          // Santulan doesn't exist in database, add hardcoded + all dynamic
          setNgos([hardcodedSantulanBhavan, ...formattedDynamicNgos]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching NGOs:', err);
        setError('Could not load all NGOs. Showing featured NGO only.');
        // On error, still show hardcoded Santulan Bhavan
        setNgos([hardcodedSantulanBhavan]);
      } finally {
        setLoading(false);
      }
    };

    fetchNgos();
  }, [hardcodedSantulanBhavan]);

  // NGO Card Component - Reusable card for each NGO
  const NGOCard = ({ ngo, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden"
    >
      <div className="flex flex-col md:flex-row p-6 gap-6">
        {/* Left Side - Image */}
        <div className="flex-shrink-0">
          <div className="w-32 h-32 md:w-36 md:h-36 rounded-xl overflow-hidden bg-gray-100">
            <img 
              src={ngo.isHardcoded ? "/images/santulan-kharadi-pune-ngos-ys5pwafr35.avif" : ""}
              alt={ngo.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23E5E7EB"/%3E%3Ctext x="50" y="50" font-family="Arial, sans-serif" font-size="14" fill="%239CA3AF" text-anchor="middle" dy=".3em"%3E${ngo.name.substring(0, 2).toUpperCase()}%3C/text%3E%3C/svg%3E`;
              }}
            />
          </div>
        </div>

        {/* Right Side - Content */}
        <div className="flex-1 min-w-0">
          {/* NGO Header */}
          <div className="mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900 mb-1">{ngo.name}</h3>
              {ngo.isHardcoded && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                  Featured
                </span>
              )}
            </div>
            <div className="flex items-center text-gray-500 text-sm">
              <MapPin className="w-3 h-3 mr-1" />
              {ngo.location}
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
            {ngo.description}
          </p>

          {/* Stats */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center px-3 py-2 bg-gray-50 rounded-lg">
              <Package className="w-4 h-4 text-gray-600 mr-2" />
              <div>
                <div className="text-sm font-semibold text-gray-900">{ngo.mealsServed}</div>
                <div className="text-xs text-gray-500">Meals</div>
              </div>
            </div>
            <div className="flex items-center px-3 py-2 bg-gray-50 rounded-lg">
              <Users className="w-4 h-4 text-gray-600 mr-2" />
              <div>
                <div className="text-sm font-semibold text-gray-900">{ngo.volunteers}</div>
                <div className="text-xs text-gray-500">Volunteers</div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-gray-600 text-sm">
              <Phone className="w-3 h-3 mr-2 text-gray-400" />
              {ngo.contact}
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <Mail className="w-3 h-3 mr-2 text-gray-400" />
              <span className="truncate">{ngo.email}</span>
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <Globe className="w-3 h-3 mr-2 text-gray-400" />
              <span className="text-blue-600 hover:text-blue-700 cursor-pointer truncate">
                {ngo.website}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-start">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Contact NGO
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Filter NGOs based on search and location
  const filteredNgos = ngos.filter(ngo => {
    const matchesSearch = ngo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ngo.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = selectedLocation === 'all' || ngo.location.toLowerCase().includes(selectedLocation.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  // Get unique locations from all NGOs
  const locations = ['all', ...new Set(ngos.map(ngo => {
    const firstPart = ngo.location.split(',')[0].trim();
    return firstPart;
  }))];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              Our Partner NGO
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Connect with our verified partner organization working tirelessly to fight hunger and reduce food waste in the community.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search NGO by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Location Filter */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {locations.map(location => (
                <option key={location} value={location}>
                  {location === 'all' ? 'All Locations' : location}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* NGOs Grid - Clean Modern Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {loading ? (
          /* Loading State */
          <div className="text-center py-12">
            <div className="inline-block">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full"
              />
            </div>
            <div className="text-gray-600 mt-4">Loading NGOs...</div>
          </div>
        ) : error && filteredNgos.length === 1 && filteredNgos[0].isHardcoded ? (
          /* Error loading dynamic NGOs, but Santulan Bhavan is available */
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6"
            >
              <p className="text-yellow-800 text-sm">{error}</p>
            </motion.div>
            <div className="space-y-6">
              {filteredNgos.map((ngo, index) => (
                <NGOCard key={ngo.id} ngo={ngo} index={index} />
              ))}
            </div>
          </div>
        ) : filteredNgos.length > 0 ? (
          <div className="space-y-6">
            {filteredNgos.map((ngo, index) => (
              <NGOCard key={ngo.id} ngo={ngo} index={index} />
            ))}
          </div>
        ) : (
          /* No Results State */
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No NGOs found</div>
            <div className="text-gray-500">Try adjusting your search or filters</div>
          </div>
        )}
      </div>

      {/* Call to Action for NGOs */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Partner With Us</h3>
            <p className="text-gray-400 mb-6">
              Join our mission to fight hunger and reduce food waste in your community.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-green-700 transition-colors duration-200"
            >
              Register Your NGO
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NGOPage;
