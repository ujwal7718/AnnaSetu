import React from 'react';

const PremiumCard = ({ 
  children, 
  variant = 'default', 
  hover = true, 
  padding = 'md', 
  className = '',
  ...props 
}) => {
  const baseClasses = 'rounded-2xl transition-all duration-300 ease-out';
  
  const variants = {
    default: 'bg-white shadow-lg border border-gray-100',
    elevated: 'bg-white shadow-xl border border-gray-100',
    glass: 'glass shadow-xl',
    gradient: 'bg-gradient-to-br from-white to-gray-50 shadow-lg border border-gray-100'
  };
  
  const paddings = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${paddings[padding]} ${hover ? 'card-hover' : ''} ${className}`;
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default PremiumCard;
