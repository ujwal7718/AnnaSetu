import React from 'react';

/**
 * Modern Button Component
 * Supports multiple variants and sizes
 */
export const Button = ({
  children,
  variant = 'primary', // primary, secondary, outline, ghost, danger
  size = 'md', // sm, md, lg
  disabled = false,
  loading = false,
  fullWidth = false,
  icon: Icon = null,
  iconPosition = 'left', // left, right
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg disabled:from-gray-400 disabled:to-gray-400',
    secondary:
      'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg disabled:bg-gray-400',
    outline:
      'border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50',
    ghost:
      'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
    danger:
      'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg disabled:bg-gray-400',
  };

  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500';

  const fullWidthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled || loading ? 'opacity-60 cursor-not-allowed' : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidthClass} ${disabledClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="w-4 h-4 border-2 border-transparent border-t-current rounded-full animate-spin" />
      )}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className="w-4 h-4" />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4" />
      )}
    </button>
  );
};

export default Button;
