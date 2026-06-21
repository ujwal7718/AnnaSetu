import React from 'react';
import { statusConfig } from '../../styles/theme';

/**
 * Badge Component
 * For displaying status, tags, and labels
 */
export const Badge = ({
  variant = 'gray', // gray, primary, success, warning, danger, info
  size = 'md', // sm, md, lg
  children,
  icon = null,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const variantStyles = {
    gray: 'bg-gray-100 text-gray-800',
    primary: 'bg-emerald-100 text-emerald-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-colors duration-200 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="text-base">{icon}</span>}
      {children}
    </span>
  );
};

/**
 * Status Badge Component
 * Uses predefined status configurations
 */
export const StatusBadge = ({ status, size = 'md', className = '' }) => {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge
      variant="gray"
      size={size}
      icon={config.icon}
      className={`${config.badge} border ${className}`}
    >
      {config.label}
    </Badge>
  );
};

export default Badge;
