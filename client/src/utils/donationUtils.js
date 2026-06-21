// Utility functions for donation filtering and calculations

export const isUrgent = (donation) => {
  if (!donation) return false;
  
  const now = new Date();
  const pickupTime = new Date(donation.pickupTime);
  
  // Calculate time difference in minutes
  const timeDiff = (pickupTime - now) / (1000 * 60);
  
  const isUrgent = (
    donation.status === "pending" &&
    timeDiff <= 120 && // within 2 hours
    timeDiff > 0 // pickup time is in the future
  );
  
  console.log(`Donation ${donation._id} urgent check:`, {
    status: donation.status,
    pickupTime: pickupTime.toISOString(),
    timeDiff: timeDiff,
    isUrgent: isUrgent
  });
  
  return isUrgent;
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Safety checks
  if (!lat1 || !lon1 || !lat2 || !lon2 || 
      isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    console.log('Invalid coordinates for distance calculation:', { lat1, lon1, lat2, lon2 });
    return 0;
  }
  
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  // Ensure we return a valid number
  return isNaN(distance) ? 0 : distance;
};

export const filterDonationsWithinRadius = (donations, centerLat, centerLng, radiusKm = 5) => {
  return donations.filter(donation => {
    if (!donation.location || !donation.location.coordinates || donation.location.coordinates.length < 2) {
      console.log('Donation missing location data:', donation._id);
      return false;
    }
    
    const lat = donation.location.coordinates[1]; // lat is second element [lng, lat]
    const lng = donation.location.coordinates[0]; // lng is first element [lng, lat]
    
    if (!lat || !lng) {
      console.log('Invalid coordinates for donation', donation._id, ':', { lat, lng });
      return false;
    }
    
    const distance = calculateDistance(centerLat, centerLng, lat, lng);
    console.log(`Distance calculated for donation ${donation._id}:`, distance, 'km');
    
    return distance <= radiusKm;
  });
};
