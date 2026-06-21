import React, { useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

const LeafletDonationMap = ({ donations = [], volunteers = [], ngoLocation, radius = 5 }) => {
  // Default to real Santulan Bhavan, Pune location if not provided - wrapped in useMemo
  const defaultNgoLocation = useMemo(() => ({ 
    lat: 18.5645039, 
    lng: 73.9459615 
  }), []); // Santulan Bhavan, Kharadi, Pune
  const mapNgoLocation = ngoLocation || defaultNgoLocation;
  
  // Convert to Leaflet format [lat, lng] - wrapped in useMemo for performance
  const mapCenter = useMemo(() => {
    try {
      const lat = mapNgoLocation?.lat || defaultNgoLocation.lat;
      const lng = mapNgoLocation?.lng || defaultNgoLocation.lng;
      return [lat, lng];
    } catch (error) {
      console.error('Error creating map center:', error);
      return [defaultNgoLocation.lat, defaultNgoLocation.lng];
    }
  }, [mapNgoLocation, defaultNgoLocation]);
  
  console.log('LeafletDonationMap props:', { donations: donations?.length, volunteers: volunteers?.length, ngoLocation: mapNgoLocation, radius });

  const [, setSelectedDonation] = useState(null);

  // Calculate distance between two points (in km) - wrapped in useCallback
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []); // Removed extra empty dependency array

  // Filter donations within radius - use useMemo since it's used as array
  const nearbyDonations = useMemo(() => {
    if (!Array.isArray(donations)) return [];
    
    return donations.filter(donation => {
      if (!donation || !donation.location) return false;
      
      // MongoDB stores coordinates as [lng, lat], Leaflet needs [lat, lng]
      const donationLat = donation.location.coordinates[1]; // lat is second element
      const donationLng = donation.location.coordinates[0]; // lng is first element
      
      const distance = calculateDistance(
        mapNgoLocation.lat, 
        mapNgoLocation.lng, 
        donationLat, 
        donationLng
      );
      return distance <= radius;
    });
  }, [donations, mapNgoLocation, calculateDistance, radius]);

  // Filter volunteers within radius - use useMemo since it's used as array
  const nearbyVolunteers = useMemo(() => {
    if (!Array.isArray(volunteers)) return [];
    
    return volunteers.filter(volunteer => {
      if (!volunteer || !volunteer.location) return false;
      
      // MongoDB stores coordinates as [lng, lat], Leaflet needs [lat, lng]
      const volunteerLat = volunteer.location.coordinates[1]; // lat is second element
      const volunteerLng = volunteer.location.coordinates[0]; // lng is first element
      
      const distance = calculateDistance(
        mapNgoLocation.lat, 
        mapNgoLocation.lng, 
        volunteerLat, 
        volunteerLng
      );
      return distance <= radius;
    });
  }, [volunteers, mapNgoLocation, calculateDistance, radius]);

  // Get marker color based on donation urgency
  const getMarkerColor = (donation) => {
    const hoursSinceCreated = (Date.now() - new Date(donation.createdAt)) / (1000 * 60 * 60);
    
    if (hoursSinceCreated < 2) return '#FF0000'; // Red - Urgent
    if (hoursSinceCreated < 6) return '#FFA500'; // Orange - Medium
    return '#00FF00'; // Green - Low urgency
  };

  // Custom marker icons
  const createCustomIcon = (color) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">
          <div style="
            color: white;
            font-size: 12px;
            font-weight: bold;
          ">D</div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15]
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-600 to-teal-600 text-white">
        <h3 className="text-lg font-semibold mb-2">Live Donation Map</h3>
        <div className="flex items-center justify-between text-sm">
          <span>NGO Coverage Area: {radius}km radius</span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
              <span>Urgent ({nearbyDonations.filter(d => (Date.now() - new Date(d.createdAt)) / (1000 * 60 * 60) < 2).length})</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
              <span>Volunteers ({nearbyVolunteers.length})</span>
            </div>
          </div>
        </div>
      </div>
      
      <MapContainer
        center={mapCenter}
        zoom={12}
        style={{ height: '400px', width: '100%' }}
        className="z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* NGO Location with 5km radius circle */}
        <Circle
          center={mapCenter}
          radius={radius * 1000} // Convert km to meters
          pathOptions={{
            color: '#4F46E5',
            fillColor: '#4F46E5',
            fillOpacity: 0.1,
            strokeOpacity: 0.3,
            weight: 2
          }}
        />
        
        {/* NGO Marker */}
        <Marker
          position={mapCenter}
          icon={createCustomIcon('#4F46E5')}
        >
          <Popup>
            <div className="p-2">
              <h4 className="font-semibold text-gray-900">NGO Location</h4>
              <p className="text-sm text-gray-600">Santulan Bhavan, Kharadi, Pune</p>
              <p className="text-xs text-gray-500">Coverage: {radius}km radius</p>
            </div>
          </Popup>
        </Marker>
        
        {/* Donation markers */}
        {nearbyDonations.map((donation) => (
          <Marker
            key={donation._id}
            position={[donation.location.coordinates[1], donation.location.coordinates[0]]} // [lat, lng]
            icon={createCustomIcon(getMarkerColor(donation))}
          >
            <Popup>
              <div className="p-3 max-w-xs">
                <h4 className="font-semibold text-gray-900 mb-2">{donation.foodType}</h4>
                <p className="text-sm text-gray-600 mb-2">{donation.description}</p>
                
                <div className="space-y-1 text-xs text-gray-500">
                  <p><strong>Quantity:</strong> {donation.quantity} {donation.unit}</p>
                  <p><strong>Donor:</strong> {donation.donor?.name}</p>
                  <p><strong>Phone:</strong> {donation.donor?.phone}</p>
                  <p><strong>Address:</strong> {donation.address}</p>
                  <p><strong>Pickup Time:</strong> {new Date(donation.pickupTime).toLocaleString()}</p>
                  <p><strong>Expiry:</strong> {new Date(donation.expiryDate).toLocaleString()}</p>
                  <p><strong>Status:</strong> 
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      donation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      donation.status === 'accepted_by_ngo' ? 'bg-orange-100 text-orange-800' :
                      donation.status === 'assigned_to_volunteer' ? 'bg-blue-100 text-blue-800' :
                      donation.status === 'picked_up' ? 'bg-purple-100 text-purple-800' :
                      donation.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {donation.status}
                    </span>
                  </p>
                  <p><strong>Distance:</strong> {calculateDistance(mapNgoLocation.lat, mapNgoLocation.lng, donation.location.coordinates[1], donation.location.coordinates[0]).toFixed(2)} km</p>
                </div>
                
                {donation.images && donation.images.length > 0 && (
                  <div className="mt-2">
                    <h5 className="font-medium text-gray-900 mb-1">Images</h5>
                    <div className="grid grid-cols-2 gap-1">
                      {donation.images.map((image, imgIndex) => (
                        <img
                          key={imgIndex}
                          src={`http://localhost:5001${image}`}
                          alt={`Donation ${imgIndex + 1}`}
                          className="w-full h-20 object-cover rounded border border-gray-200"
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={() => setSelectedDonation(donation)}
                  className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Volunteer markers */}
        {nearbyVolunteers.map((volunteer) => (
          <Marker
            key={volunteer._id}
            position={[volunteer.location.coordinates[1], volunteer.location.coordinates[0]]} // [lat, lng]
            icon={createCustomIcon('#00FF00')}
          >
            <Popup>
              <div className="p-3 max-w-xs">
                <h4 className="font-semibold text-gray-900 mb-2">{volunteer.name}</h4>
                <div className="space-y-1 text-xs text-gray-500">
                  <p><strong>Email:</strong> {volunteer.email}</p>
                  <p><strong>Phone:</strong> {volunteer.phone}</p>
                  <p><strong>Vehicle:</strong> {volunteer.vehicle || 'N/A'}</p>
                  <p><strong>Rating:</strong> {volunteer.rating || 'N/A'} ⭐</p>
                  <p><strong>Completed:</strong> {volunteer.completedPickups || 0} pickups</p>
                  <p><strong>Distance:</strong> {calculateDistance(mapNgoLocation.lat, mapNgoLocation.lng, volunteer.location.coordinates[1], volunteer.location.coordinates[0]).toFixed(2)} km</p>
                  <p><strong>Available:</strong> 
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      volunteer.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {volunteer.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <div className="p-4 bg-gray-50 border-t">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">{nearbyDonations.length}</p>
            <p className="text-sm text-gray-600">Active Donations</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{nearbyVolunteers.length}</p>
            <p className="text-sm text-gray-600">Available Volunteers</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">{radius}km</p>
            <p className="text-sm text-gray-600">Coverage Radius</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeafletDonationMap;
