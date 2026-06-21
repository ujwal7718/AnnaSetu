import React from 'react';
import PremiumCard from './PremiumCard';

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  gradient = 'from-blue-600 to-green-600',
  trend = null,
  loading = false 
}) => {
  if (loading) {
    return (
      <PremiumCard className="animate-fadeIn">
        <div className="flex items-center">
          <div className="skeleton w-12 h-12 rounded-xl mr-4"></div>
          <div className="flex-1">
            <div className="skeleton h-4 w-20 mb-2"></div>
            <div className="skeleton h-8 w-16"></div>
          </div>
        </div>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard className="animate-scaleIn hover:scale-105 transition-transform duration-300">
      <div className="flex items-center">
        <div className={`flex-shrink-0 bg-gradient-to-r ${gradient} rounded-xl p-3 mr-4`}>
          <div className="w-6 h-6 text-white">
            {icon}
          </div>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className={`flex items-center mt-1 text-sm ${
              trend.value > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                {trend.value > 0 ? (
                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                )}
              </svg>
              {trend.label}
            </div>
          )}
        </div>
      </div>
    </PremiumCard>
  );
};

export default StatsCard;
