import React, { useState, useCallback, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle, InfoWindow } from '@react-google-maps/api';

const DonationMap = ({ donations, volunteers, ngoLocation, radius = 5, totalVolunteers, filteredVolunteers }) => {
  // Default to real Santulan Bhavan, Pune location if not provided - wrapped in useMemo
  const defaultNgoLocation = useMemo(() => ({ 
    lat: 18.5645039, 
    lng: 73.9459615 
  }), []); // Santulan Bhavan, Kharadi, Pune
  const mapNgoLocation = ngoLocation || defaultNgoLocation;
  
  console.log('DonationMap props:', { donations: donations?.length, volunteers: volunteers?.length, ngoLocation: mapNgoLocation, radius });
  
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
  });

  console.log('Google Maps API key:', process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing');
  console.log('Google Maps loaded:', isLoaded);
  console.log('Google Maps load error:', loadError);

  const [selectedDonation, setSelectedDonation] = useState(null);
  const mapCenter = mapNgoLocation;
  const mapZoom = 12;

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
  }, []);

  // Filter donations within radius - wrapped in useCallback
  const nearbyDonations = useCallback(() => {
    return donations.filter(donation => {
      if (!donation.location) return false;
      const distance = calculateDistance(
        mapNgoLocation.lat, 
        mapNgoLocation.lng, 
        donation.location.lat, 
        donation.location.lng
      );
      return distance <= radius;
    });
  }, [donations, mapNgoLocation, calculateDistance, radius]);

  // Filter volunteers within radius - wrapped in useCallback
  const nearbyVolunteers = useCallback(() => {
    return volunteers.filter(volunteer => {
      if (!volunteer.location) return false;
      const distance = calculateDistance(
        mapNgoLocation.lat, 
        mapNgoLocation.lng, 
        volunteer.location.lat, 
        volunteer.location.lng
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
  const getMarkerIcon = (type, color) => {
    return {
      path: type === 'donation' 
        ? 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z'
        : 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
      fillColor: color,
      fillOpacity: 0.8,
      strokeWeight: 2,
      strokeColor: '#ffffff',
      scale: 1.2,
      anchor: new window.google.maps.Point(12, 24),
    };
  };

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-2">⚠️ Map Error</div>
          <p className="text-gray-700">Failed to load Google Maps. Please check your API key and internet connection.</p>
          <p className="text-sm text-gray-500 mt-2">Error: {loadError.message}</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

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
              <span>Volunteers ({nearbyVolunteers.length}{totalVolunteers && filteredVolunteers ? ` of ${totalVolunteers}` : ''})</span>
            </div>
          </div>
        </div>
        {totalVolunteers && filteredVolunteers && totalVolunteers > filteredVolunteers.length && (
          <div className="mt-2 text-xs bg-white/20 rounded px-2 py-1">
            📍 Showing {filteredVolunteers.length} of {totalVolunteers} volunteers (valid location in {radius}km radius)
          </div>
        )}
      </div>
      
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '500px' }}
        center={mapCenter}
        zoom={mapZoom}
        options={{
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        }}
      >
        {/* NGO Location with 5km radius circle */}
        <Marker
          position={ngoLocation}
          icon={{
            path: 'M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z',
            fillColor: '#4F46E5',
            fillOpacity: 0.9,
            strokeWeight: 2,
            strokeColor: '#ffffff',
            scale: 1.5,
            anchor: new window.google.maps.Point(12, 10),
          }}
        />
        
        <Circle
          center={ngoLocation}
          radius={radius * 1000} // Convert km to meters
          options={{
            fillColor: '#4F46E5',
            fillOpacity: 0.1,
            strokeColor: '#4F46E5',
            strokeOpacity: 0.3,
            strokeWeight: 2,
          }}
        />

        {/* Donation markers */}
        {nearbyDonations.map((donation) => (
          <Marker
            key={donation._id}
            position={{ lat: donation.location.lat, lng: donation.location.lng }}
            icon={getMarkerIcon('donation', getMarkerColor(donation))}
            onClick={() => setSelectedDonation(donation)}
          />
        ))}

        {/* Volunteer markers */}
        {nearbyVolunteers.map((volunteer) => (
          <Marker
            key={volunteer._id}
            position={{ lat: volunteer.location.lat, lng: volunteer.location.lng }}
            icon={getMarkerIcon('volunteer', '#00FF00')}
          />
        ))}

        {/* Info window for selected donation */}
        {selectedDonation && (
          <InfoWindow
            position={{ lat: selectedDonation.location.lat, lng: selectedDonation.location.lng }}
            onCloseClick={() => setSelectedDonation(null)}
          >
            <div className="p-3 max-w-xs">
              <h4 className="font-semibold text-gray-900 mb-2">{selectedDonation.foodType}</h4>
              <p className="text-sm text-gray-600 mb-2">{selectedDonation.description}</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Donor:</strong> {selectedDonation.donorName}</p>
                <p><strong>Quantity:</strong> {selectedDonation.quantity}</p>
                <p><strong>Urgency:</strong> {
                  (Date.now() - new Date(selectedDonation.createdAt)) / (1000 * 60 * 60) < 2 ? 'High' :
                  (Date.now() - new Date(selectedDonation.createdAt)) / (1000 * 60 * 60) < 6 ? 'Medium' : 'Low'
                }</p>
                <p><strong>Distance:</strong> {
                  calculateDistance(
                    ngoLocation.lat, 
                    ngoLocation.lng, 
                    selectedDonation.location.lat, 
                    selectedDonation.location.lng
                  ).toFixed(2)
                } km</p>
              </div>
              <button className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                Assign Volunteer
              </button>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      
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

export default DonationMap;
