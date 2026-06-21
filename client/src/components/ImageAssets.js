import React from 'react';
import { Zap, MapPin, Shield, Package, Users, Clock, TrendingUp, Award, HandHeart } from 'lucide-react';

// Clean icon-based components for professional look
export const RealTimeMatchingIcon = ({ className = "" }) => (
  <div className={`w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center ${className}`}>
    <div className="text-center p-8">
      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
        <Zap className="w-8 h-8" />
      </div>
      <div className="text-blue-900 font-semibold">Instant Matching</div>
      <div className="text-blue-700 text-sm mt-1">Real-time connections</div>
    </div>
  </div>
);

export const LocationSearchIcon = ({ className = "" }) => (
  <div className={`w-full h-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center ${className}`}>
    <div className="text-center p-8">
      <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
        <MapPin className="w-8 h-8" />
      </div>
      <div className="text-green-900 font-semibold">Smart Location</div>
      <div className="text-green-700 text-sm mt-1">Area-based search</div>
    </div>
  </div>
);

export const VerifiedNGOIcon = ({ className = "" }) => (
  <div className={`w-full h-full bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center ${className}`}>
    <div className="text-center p-8">
      <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
        <Shield className="w-8 h-8" />
      </div>
      <div className="text-purple-900 font-semibold">Verified Partners</div>
      <div className="text-purple-700 text-sm mt-1">Trusted organizations</div>
    </div>
  </div>
);

export const EasyDonationIcon = ({ className = "" }) => (
  <div className={`w-full h-full bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center ${className}`}>
    <div className="text-center p-8">
      <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
        <HandHeart className="w-8 h-8" />
      </div>
      <div className="text-orange-900 font-semibold">Simple Process</div>
      <div className="text-orange-700 text-sm mt-1">Easy donation flow</div>
    </div>
  </div>
);

export const FoodDonationIcon = ({ className = "" }) => (
  <div className={`w-full h-full bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center ${className}`}>
    <div className="text-center p-8">
      <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
        <Package className="w-8 h-8" />
      </div>
      <div className="text-teal-900 font-semibold">Fresh Food</div>
      <div className="text-teal-700 text-sm mt-1">Quality donations</div>
    </div>
  </div>
);

// Clean illustration components for other sections
export const CommunityIllustration = ({ className = "" }) => (
  <div className={`w-full h-full bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center ${className}`}>
    <div className="text-center p-8">
      <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
        <Users className="w-8 h-8" />
      </div>
      <div className="text-emerald-900 font-semibold">Community Impact</div>
      <div className="text-emerald-700 text-sm mt-1">Together we help</div>
    </div>
  </div>
);

export const StatsIllustration = ({ className = "" }) => (
  <div className={`w-full h-full bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center ${className}`}>
    <div className="text-center p-8">
      <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
        <TrendingUp className="w-8 h-8" />
      </div>
      <div className="text-indigo-900 font-semibold">Real Impact</div>
      <div className="text-indigo-700 text-sm mt-1">Track progress</div>
    </div>
  </div>
);

export const VolunteerIllustration = ({ className = "" }) => (
  <div className={`w-full h-full bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center ${className}`}>
    <div className="text-center p-8">
      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
        <Clock className="w-8 h-8" />
      </div>
      <div className="text-blue-900 font-semibold">24/7 Support</div>
      <div className="text-blue-700 text-sm mt-1">Always available</div>
    </div>
  </div>
);

export const AwardIllustration = ({ className = "" }) => (
  <div className={`w-full h-full bg-gradient-to-br from-yellow-50 to-amber-100 flex items-center justify-center ${className}`}>
    <div className="text-center p-8">
      <div className="w-16 h-16 bg-yellow-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
        <Award className="w-8 h-8" />
      </div>
      <div className="text-yellow-900 font-semibold">Excellence</div>
      <div className="text-yellow-700 text-sm mt-1">Quality service</div>
    </div>
  </div>
);

// Fallback image component with error handling
export const SafeImage = ({ src, alt, className = "", fallback = null }) => {
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  if (error || !src) {
    return fallback || <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
      <div className="text-gray-400 text-center">
        <div className="text-4xl mb-2">📷</div>
        <div className="text-sm">Image not available</div>
      </div>
    </div>;
  }

  return (
    <div className={`relative ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={() => setLoading(false)}
        onError={() => {
          console.error(`Failed to load image: ${src}`);
          setError(true);
        }}
      />
      {loading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          </div>
        </div>
      )}
    </div>
  );
};
