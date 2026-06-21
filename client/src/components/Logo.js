import React from 'react';
import logoImage from '../assets/logo.png';

const Logo = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-10 h-10',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  // Using your actual logo image from assets folder
  return (
    <img 
      src={logoImage} 
      alt="Food Donation Platform Logo" 
      className={`${sizeClasses[size]} ${className} rounded-lg object-contain`}
    />
  );
};

export default Logo;
