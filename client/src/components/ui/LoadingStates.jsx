import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Skeleton Loader Component
 * Modern skeleton loading animation
 */
export const SkeletonLoader = ({
  count = 1,
  type = 'card', // card, line, circle
  className = '',
}) => {
  if (type === 'line') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"
            style={{
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }}
          />
        ))}
      </div>
    );
  }

  if (type === 'circle') {
    return (
      <div className={`flex gap-2 ${className}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-gray-200 p-6 space-y-4 animate-pulse"
        >
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-100 rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Empty State Component
 * Shown when no data is available
 */
export const EmptyState = ({
  icon: Icon = AlertCircle,
  title,
  description,
  action = null,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">
        {title}
      </h3>
      {description && (
        <p className="text-gray-600 text-center mb-6 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

/**
 * Loading Spinner Component
 * Full screen or inline loading indicator
 */
export const LoadingSpinner = ({
  fullScreen = false,
  size = 'md', // sm, md, lg
  text = 'Loading...',
}) => {
  const sizeStyles = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeStyles[size]} border-gray-200 border-t-emerald-600 rounded-full animate-spin`}
      />
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

/**
 * CSS for shimmer animation
 */
export const ShimmerStyle = () => (
  <style>{`
    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
      }
    }
  `}</style>
);
