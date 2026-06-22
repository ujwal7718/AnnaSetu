import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const API_BASE = API_BASE_URL;

const EMPTY_FORM = {
  foodType: 'vegetarian',
  quantity: '',
  unit: 'kg',
  description: '',
  expiryDate: '',
  pickupTime: '',
  address: '',
  location: { lat: '', lng: '' }
};

/**
 * DonationForm
 *
 * Props:
 *  onSuccess(newDonation) – called after the API confirms creation.
 *                           Receives the newly created donation object so the
 *                           parent can prepend it to its local list without a
 *                           second network request.
 *  onCancel()            – called when the user clicks "Cancel / Back".
 *
 * Why callback props instead of internal navigation:
 *  DonorDashboard renders this form in-page (not as a separate route).
 *  Lifting the success event up lets the dashboard close the form, prepend the
 *  donation, update stats, and show a toast — all in one synchronous state
 *  update with zero extra API calls.
 */
const DonationForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const { foodType, quantity, unit, description, expiryDate, pickupTime, address, location } = formData;

  // ── Field change handler ────────────────────────────────────────────────────

  const onChange = e => {
    if (e.target.name.includes('location.')) {
      const locationField = e.target.name.split('.')[1];
      setFormData({ ...formData, location: { ...location, [locationField]: e.target.value } });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  // ── Image handling ──────────────────────────────────────────────────────────

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (images.length + files.length > 3) {
      setError('Maximum 3 images allowed');
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError(`${file.name} is larger than 2MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length !== files.length) return;

    const newPreviews = [...imagePreviews];
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        setImagePreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
    });

    setImages([...images, ...validFiles]);
    setError('');
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  // ── Geolocation ─────────────────────────────────────────────────────────────

  const getCurrentLocation = () => {
    // Debug 1: Check if navigator.geolocation exists
    console.log('🌍 [GEOLOCATION] 1. Checking navigator.geolocation...');
    if (!navigator.geolocation) {
      console.error('❌ [GEOLOCATION] navigator.geolocation is NOT supported');
      setError('Geolocation is not supported by your browser');
      return;
    }
    console.log('✅ [GEOLOCATION] navigator.geolocation is supported');

    // Debug 2: Log when location request starts
    console.log('🌍 [GEOLOCATION] 2. Starting location request...');
    setError(''); // Clear any previous errors
    
    // Geolocation options
    const geolocationOptions = {
      enableHighAccuracy: true,  // Use GPS if available (more accurate)
      timeout: 10000,            // 10 second timeout
      maximumAge: 0              // Don't use cached position
    };
    console.log('⚙️ [GEOLOCATION] Options:', geolocationOptions);

    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        console.log('✅ [GEOLOCATION] 3. Location request succeeded');
        
        // Debug 3: Log full success response
        console.log('📍 [GEOLOCATION] Full success response:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: new Date(position.timestamp).toISOString()
        });

        // Debug 4: Log extracted values
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log('📊 [GEOLOCATION] 4. Extracted values:', {
          lat,
          lng,
          coordinatesPair: `[${lng}, ${lat}]` // GeoJSON format [lng, lat]
        });

        // Use functional update to avoid stale state
        console.log('🔄 [GEOLOCATION] 5. Updating formData with functional update...');
        setFormData(prevFormData => {
          const updatedFormData = {
            ...prevFormData,
            location: {
              lat: String(lat), // Convert to string for input field
              lng: String(lng)  // Convert to string for input field
            }
          };
          console.log('📝 [GEOLOCATION] Updated formData:', updatedFormData);
          return updatedFormData;
        });

        console.log('✅ [GEOLOCATION] 6. State update scheduled. Latitude and Longitude fields should update immediately.');
      },
      // Error callback
      (error) => {
        console.error('❌ [GEOLOCATION] 3. Location request failed');
        
        // Debug 3: Log full error object
        console.log('📋 [GEOLOCATION] Full error object:', {
          code: error.code,
          message: error.message,
          errorCodeName: getGeolocationErrorName(error.code)
        });

        // Get user-friendly error message based on error code
        let errorMessage = 'Unable to get your location. Please enter coordinates manually.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            console.error('🔒 [GEOLOCATION] Permission denied by user');
            errorMessage = 'Location permission denied. Please enable location in browser settings and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            console.error('📡 [GEOLOCATION] Position unavailable (GPS/network issue)');
            errorMessage = 'Location services temporarily unavailable. Please try again or enter coordinates manually.';
            break;
          case error.TIMEOUT:
            console.error('⏱️ [GEOLOCATION] Request timed out');
            errorMessage = 'Location request timed out. Please try again or enter coordinates manually.';
            break;
          case error.UNKNOWN_ERROR:
            console.error('❓ [GEOLOCATION] Unknown error occurred');
            errorMessage = 'An unknown error occurred while retrieving location. Please enter coordinates manually.';
            break;
          default:
            console.error('❓ [GEOLOCATION] Unrecognized error code:', error.code);
            errorMessage = `Geolocation error (code: ${error.code}). Please enter coordinates manually.`;
        }

        setError(errorMessage);
      },
      // Geolocation options
      geolocationOptions
    );
  };

  // Helper function to get error code name
  const getGeolocationErrorName = (code) => {
    const errorMap = {
      1: 'PERMISSION_DENIED',
      2: 'POSITION_UNAVAILABLE',
      3: 'TIMEOUT',
      0: 'UNKNOWN_ERROR'
    };
    return errorMap[code] || `UNKNOWN (${code})`;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const onSubmit = async e => {
    e.preventDefault();
    setError('');
    setUploading(true);

    try {
      const token = localStorage.getItem('token');

      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'location') {
          formDataToSend.append('location', JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });
      images.forEach(file => formDataToSend.append('images', file));

      const res = await axios.post(`${API_BASE}/api/donations`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Reset form state so if the parent ever re-shows the form it's clean
      setFormData(EMPTY_FORM);
      setImages([]);
      setImagePreviews([]);

      // Hand the new donation document up to the parent.
      // The parent (DonorDashboard) will:
      //   1. Close this form
      //   2. Prepend the donation to its list
      //   3. Show a success toast
      if (onSuccess) onSuccess(res.data);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create donation. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create Food Donation</h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Food Type */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Food Type</label>
            <select
              name="foodType"
              value={foodType}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="vegetarian">Vegetarian</option>
              <option value="non-vegetarian">Non-Vegetarian</option>
              <option value="both">Both</option>
            </select>
          </div>

          {/* Quantity */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={quantity}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              min="0.1"
              step="0.1"
            />
          </div>

          {/* Unit */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Unit</label>
            <select
              name="unit"
              value={unit}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="kg">Kilograms</option>
              <option value="liters">Liters</option>
              <option value="pieces">Pieces</option>
              <option value="servings">Servings</option>
            </select>
          </div>

          {/* Expiry Date */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Expiry Date</label>
            <input
              type="datetime-local"
              name="expiryDate"
              value={expiryDate}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Pickup Time */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Pickup Time</label>
            <input
              type="datetime-local"
              name="pickupTime"
              value={pickupTime}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Image Upload */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Food Images (Optional — max 3, 2 MB each)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: JPG, PNG, JPEG. Maximum size: 2 MB per image.
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
          <textarea
            name="description"
            value={description}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            rows="3"
            placeholder="Describe the food items, condition, etc."
          />
        </div>

        {/* Address */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Pickup Address</label>
          <textarea
            name="address"
            value={address}
            onChange={onChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            rows="2"
          />
        </div>

        {/* Location */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">Location Coordinates</label>
          <button
            type="button"
            onClick={getCurrentLocation}
            className="mb-2 px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm transition-colors"
          >
            📍 Get Current Location
          </button>
          <div className="flex gap-2">
            <input
              type="number"
              name="location.lat"
              value={location.lat}
              onChange={onChange}
              placeholder="Latitude"
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="any"
              required
            />
            <input
              type="number"
              name="location.lng"
              value={location.lng}
              onChange={onChange}
              placeholder="Longitude"
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="any"
              required
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold transition-colors"
        >
          {uploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading donation…
            </>
          ) : (
            '🍱 Create Donation'
          )}
        </button>
      </form>
    </div>
  );
};

export default DonationForm;
