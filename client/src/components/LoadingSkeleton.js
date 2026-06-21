import React from 'react';

const LoadingSkeleton = ({ 
  variant = 'text', 
  width, 
  height, 
  className = '',
  lines = 1 
}) => {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'h-32 rounded-2xl'
  };
  
  const baseClasses = `skeleton ${variants[variant]} ${className}`;
  
  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${index === lines - 1 ? 'w-3/4' : 'w-full'}`}
            style={{
              width: width && index === 0 ? width : undefined,
              height: height || undefined
            }}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div
      className={baseClasses}
      style={{
        width: width || undefined,
        height: height || undefined
      }}
    />
  );
};

export default LoadingSkeleton;
