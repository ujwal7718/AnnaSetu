import React from 'react';

/**
 * Modern Card Component
 * Provides consistent card styling with optional hover animations
 */
export const Card = ({
  children,
  className = '',
  hover = false,
  onClick = null,
  variant = 'default', // default, gradient, elevated
  ...props
}) => {
  const baseStyles =
    'rounded-lg border transition-all duration-200';
  
  const variantStyles = {
    default: 'bg-white border-gray-200 shadow-sm hover:shadow-md',
    gradient:
      'bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-sm hover:shadow-md',
    elevated: 'bg-white border-gray-100 shadow-md hover:shadow-lg',
  };

  const hoverStyles = hover
    ? 'cursor-pointer hover:scale-[1.02] hover:-translate-y-1'
    : '';

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Stat Card Component
 * Perfect for dashboard overview metrics
 */
export const StatCard = ({
  icon: Icon,
  label,
  value,
  trend = null,
  subtitle = null,
  className = '',
  gradient = false,
}) => {
  const backgroundClass = gradient
    ? 'bg-gradient-to-br from-emerald-50 to-teal-50'
    : 'bg-white';

  return (
    <Card
      className={`p-6 ${backgroundClass} ${className}`}
      variant="default"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">
            {label}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span
                className={`text-sm font-medium ${
                  trend.type === 'up'
                    ? 'text-green-600'
                    : trend.type === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {trend.type === 'up' ? '↑' : trend.type === 'down' ? '↓' : '→'}
                {' '}
                {trend.value}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg p-3 ml-4">
            <Icon className="w-6 h-6 text-emerald-600" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default Card;
