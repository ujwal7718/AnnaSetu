/**
 * API Configuration
 * 
 * Centralized API endpoint configuration for the application.
 * Uses environment variables with fallback to localhost for development.
 */

// Base API URL - uses environment variable or defaults to localhost
// Supports REACT_APP_API_URL (current) and REACT_APP_SERVER_URL (for compatibility)
export const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_SERVER_URL || 'http://localhost:5001';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH_ME: '/api/auth/me',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_PROFILE: '/api/auth/profile',
  AUTH_APPROVED_NGOS: '/api/auth/approved-ngos',
  
  // Donations
  DONATIONS: '/api/donations',
  MY_DONATIONS: '/api/donations/my-donations',
  
  // Feedback
  FEEDBACK: '/api/feedback',
  FEEDBACK_ANALYSIS: '/api/feedback-analysis',
  
  // Chat
  CHAT: '/api/chat',
  
  // Admin
  ADMIN_MAP_DATA: '/api/admin/map-data',
};

// Helper function to get full URL
export const getApiUrl = (endpoint) => {
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to get image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_BASE_URL}${imagePath}`;
};

export default API_BASE_URL;
