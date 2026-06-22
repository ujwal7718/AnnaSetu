import React, { useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Eye, EyeOff } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getImageUrl } from '../config/api';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const AdminMapEnhanced = ({ ngos = [], donations = [], volunteers = [] }) => {
  // Default to Pune city center
  const defaultCenter = useMemo(() => ({ lat: 18.5204, lng: 73.8567 }), []);
  
  // Filter states
  const [showNGOs, setShowNGOs] = useState(true);
  const [showDonations, setShowDonations] = useState(true);
  const [showVolunteers, setShowVolunteers] = useState(true);
  const [selectedNGO, setSelectedNGO] = useState(null);

  console.log('AdminMapEnhanced props:', {
    ngos: ngos?.length,
    donations: donations?.length,
    volunteers: volunteers?.length
  });

  // Calculate distance between two points (in km)
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Calculate which donations fall within each NGO's coverage
  const donationsByNGO = useMemo(() => {
    const result = {};
    
    if (!Array.isArray(ngos) || !Array.isArray(donations)) return result;

    ngos.forEach(ngo => {
      if (!ngo.location || !ngo.location.coordinates) return;
      
      const ngoLat = ngo.location.coordinates[1];
      const ngoLng = ngo.location.coordinates[0];
      const coverageRadius = ngo.coverageRadius || 5;

      const nearbyDonations = donations.filter(donation => {
        if (!donation.location || !donation.location.coordinates) return false;
        
        const donationLat = donation.location.coordinates[1];
        const donationLng = donation.location.coordinates[0];
        
        const distance = calculateDistance(ngoLat, ngoLng, donationLat, donationLng);
        return distance <= coverageRadius;
      });

      result[ngo._id] = nearbyDonations;
    });

    return result;
  }, [ngos, donations, calculateDistance]);

  // Custom marker icons
  const createNGOIcon = (index) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
    const color = colors[index % colors.length];
    
    return L.divIcon({
      className: 'custom-marker ngo-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          font-size: 18px;
        ">
          🏢
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };

  const createDonationIcon = (status) => {
    const statusColors = {
      pending: '#FFD93D',
      accepted_by_ngo: '#6BCB77',
      assigned_to_volunteer: '#4D96FF',
      picked_up: '#FF6B9D',
      completed: '#00B89B',
      cancelled: '#888888'
    };
    
    const color = statusColors[status] || '#888888';

    return L.divIcon({
      className: 'custom-marker donation-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          font-size: 14px;
        ">
          🍱
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });
  };

  const createVolunteerIcon = () => {
    return L.divIcon({
      className: 'custom-marker volunteer-marker',
      html: `
        <div style="
          background-color: #9B59B6;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          font-size: 16px;
        ">
          👤
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    });
  };

  // NGO color scheme
  const ngoColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
  const getNGOColor = (index) => ngoColors[index % ngoColors.length];

  // Calculate map bounds to fit all data
  const mapBounds = useMemo(() => {
    const allLocations = [
      ...(ngos.filter(n => n.location?.coordinates) || []),
      ...(donations.filter(d => d.location?.coordinates) || []),
      ...(volunteers.filter(v => v.location?.coordinates) || [])
    ];

    if (allLocations.length === 0) {
      return [[defaultCenter.lat, defaultCenter.lng], [defaultCenter.lat, defaultCenter.lng]];
    }

    const lats = allLocations.map(l => l.location.coordinates[1]);
    const lngs = allLocations.map(l => l.location.coordinates[0]);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return [[minLat, minLng], [maxLat, maxLng]];
  }, [ngos, donations, volunteers, defaultCenter]);

  return (
    <div className="space-y-4">
      {/* Map Header with Legend */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <h3 className="text-lg font-semibold mb-3">Multi-NGO Coverage Map</h3>
          
          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500" style={{ backgroundColor: '#FF6B6B' }}></div>
              <span>NGO Marker</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500" style={{ backgroundColor: '#FFD93D' }}></div>
              <span>Donation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-purple-500" style={{ backgroundColor: '#9B59B6' }}></div>
              <span>Volunteer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-blue-400"></div>
              <span>Coverage Area</span>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowNGOs(!showNGOs)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                showNGOs
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-gray-300 text-gray-600'
              }`}
            >
              {showNGOs ? <Eye size={18} /> : <EyeOff size={18} />}
              NGOs ({ngos.length})
            </button>
            
            <button
              onClick={() => setShowDonations(!showDonations)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                showDonations
                  ? 'bg-yellow-500 text-white shadow-md'
                  : 'bg-gray-300 text-gray-600'
              }`}
            >
              {showDonations ? <Eye size={18} /> : <EyeOff size={18} />}
              Donations ({donations.length})
            </button>
            
            <button
              onClick={() => setShowVolunteers(!showVolunteers)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                showVolunteers
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-gray-300 text-gray-600'
              }`}
            >
              {showVolunteers ? <Eye size={18} /> : <EyeOff size={18} />}
              Volunteers ({volunteers.length})
            </button>

            {selectedNGO && (
              <button
                onClick={() => setSelectedNGO(null)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-blue-500 text-white transition-all"
              >
                ✕ Clear Filter
              </button>
            )}
          </div>
        </div>

        {/* Map Container */}
        <MapContainer
          bounds={mapBounds}
          boundsOptions={{ padding: [50, 50] }}
          style={{ height: '500px', width: '100%' }}
          className="z-10"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* NGO Markers and Coverage Circles */}
          {showNGOs && Array.isArray(ngos) && ngos.map((ngo, index) => {
            if (!ngo.location || !ngo.location.coordinates) return null;
            
            const ngoLat = ngo.location.coordinates[1];
            const ngoLng = ngo.location.coordinates[0];
            const coverageRadius = ngo.coverageRadius || 5;
            const color = getNGOColor(index);

            // Filter donations for this NGO if selected
            const relatedDonations = selectedNGO 
              ? (donationsByNGO[ngo._id] || []).filter(d => 
                  selectedNGO === ngo._id || selectedNGO === 'all'
                )
              : (donationsByNGO[ngo._id] || []);

            return (
              <div key={ngo._id}>
                {/* Coverage Circle */}
                <Circle
                  center={[ngoLat, ngoLng]}
                  radius={coverageRadius * 1000}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.1,
                    strokeOpacity: 0.3,
                    weight: 2,
                    dashArray: '5, 5'
                  }}
                />

                {/* NGO Marker */}
                <Marker
                  position={[ngoLat, ngoLng]}
                  icon={createNGOIcon(index)}
                  eventHandlers={{
                    click: () => setSelectedNGO(selectedNGO === ngo._id ? null : ngo._id)
                  }}
                >
                  <Popup>
                    <div className="p-3 min-w-xs max-w-sm">
                      <h4 className="font-semibold text-gray-900 mb-2">{ngo.name}</h4>
                      
                      <div className="space-y-1 text-sm text-gray-600 mb-3">
                        <p><strong>Email:</strong> {ngo.email}</p>
                        <p><strong>Phone:</strong> {ngo.phone}</p>
                        <p><strong>Address:</strong> {ngo.address || 'Not provided'}</p>
                        <p><strong>Coverage Radius:</strong> {coverageRadius} km</p>
                        <p><strong>Status:</strong>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            ngo.approvalStatus === 'approved' 
                              ? 'bg-green-100 text-green-800'
                              : ngo.approvalStatus === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {ngo.approvalStatus}
                          </span>
                        </p>
                      </div>

                      <div className="bg-blue-50 rounded p-2 text-sm">
                        <strong>Donations in Coverage:</strong> {relatedDonations.length}
                      </div>

                      {relatedDonations.length > 0 && (
                        <button
                          onClick={() => setSelectedNGO(ngo._id)}
                          className="mt-2 w-full bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-700"
                        >
                          View Coverage Donations
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              </div>
            );
          })}

          {/* Donation Markers */}
          {showDonations && Array.isArray(donations) && donations.map((donation) => {
            if (!donation.location || !donation.location.coordinates) return null;
            
            // If NGO is selected, only show donations in that NGO's coverage
            if (selectedNGO && selectedNGO !== 'all') {
              const selectedDonations = donationsByNGO[selectedNGO] || [];
              if (!selectedDonations.find(d => d._id === donation._id)) {
                return null;
              }
            }

            const donationLat = donation.location.coordinates[1];
            const donationLng = donation.location.coordinates[0];

            return (
              <Marker
                key={donation._id}
                position={[donationLat, donationLng]}
                icon={createDonationIcon(donation.status)}
              >
                <Popup>
                  <div className="p-3 max-w-xs">
                    <h4 className="font-semibold text-gray-900 mb-2">{donation.foodType}</h4>
                    
                    <div className="space-y-1 text-sm text-gray-600 mb-2">
                      <p><strong>Quantity:</strong> {donation.quantity} {donation.unit}</p>
                      <p><strong>Donor:</strong> {donation.donor?.name}</p>
                      <p><strong>Donor Phone:</strong> {donation.donor?.phone}</p>
                      <p><strong>Pickup Time:</strong> {new Date(donation.pickupTime).toLocaleString()}</p>
                      <p><strong>Status:</strong>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          donation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          donation.status === 'accepted_by_ngo' ? 'bg-green-100 text-green-800' :
                          donation.status === 'assigned_to_volunteer' ? 'bg-blue-100 text-blue-800' :
                          donation.status === 'picked_up' ? 'bg-purple-100 text-purple-800' :
                          donation.status === 'completed' ? 'bg-green-200 text-green-900' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {donation.status}
                        </span>
                      </p>
                    </div>

                    {donation.images && donation.images.length > 0 && (
                      <div className="mt-2">
                        <img
                          src={getImageUrl(donation.images[0])}
                          alt="Donation"
                          className="w-full h-24 object-cover rounded border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Volunteer Markers */}
          {showVolunteers && Array.isArray(volunteers) && volunteers.map((volunteer) => {
            if (!volunteer.location || !volunteer.location.coordinates) return null;

            const volunteerLat = volunteer.location.coordinates[1];
            const volunteerLng = volunteer.location.coordinates[0];

            return (
              <Marker
                key={volunteer._id}
                position={[volunteerLat, volunteerLng]}
                icon={createVolunteerIcon()}
              >
                <Popup>
                  <div className="p-3 max-w-xs">
                    <h4 className="font-semibold text-gray-900 mb-2">{volunteer.name}</h4>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Email:</strong> {volunteer.email}</p>
                      <p><strong>Phone:</strong> {volunteer.phone}</p>
                      <p><strong>Vehicle:</strong> {volunteer.vehicle || 'N/A'}</p>
                      <p><strong>Availability:</strong>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          volunteer.isAvailable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {volunteer.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </p>
                      <p><strong>Completed Pickups:</strong> {volunteer.completedPickups || 0}</p>
                      <p><strong>Rating:</strong> {volunteer.rating ? `${volunteer.rating.toFixed(1)} ⭐` : 'No ratings'}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Statistics Footer */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-2xl font-bold text-red-600">{ngos.length}</p>
          <p className="text-xs text-gray-600 mt-1">Active NGOs</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-2xl font-bold text-yellow-600">{donations.length}</p>
          <p className="text-xs text-gray-600 mt-1">Donations</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-2xl font-bold text-purple-600">{volunteers.length}</p>
          <p className="text-xs text-gray-600 mt-1">Volunteers</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-2xl font-bold text-blue-600">
            {ngos.reduce((sum, ngo) => sum + (donationsByNGO[ngo._id]?.length || 0), 0)}
          </p>
          <p className="text-xs text-gray-600 mt-1">Coverage Matches</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-2xl font-bold text-green-600">
            {donations.filter(d => d.status === 'completed').length}
          </p>
          <p className="text-xs text-gray-600 mt-1">Completed</p>
        </div>
      </div>
    </div>
  );
};

export default AdminMapEnhanced;
