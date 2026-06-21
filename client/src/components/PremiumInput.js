import React, { useState, useRef } from 'react';

const PremiumInput = ({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  error, 
  required = false,
  disabled = false,
  className = '',
  icon,
  showPasswordToggle = false,
  ...props 
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef(null);
  const hasValue = value && value.length > 0;
  
  const inputType = type === 'password' && showPassword ? 'text' : type;
  
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);
  
  const togglePassword = () => setShowPassword(!showPassword);
  
  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        
        {label && (
          <label className={`absolute transition-all duration-200 ease-out pointer-events-none
            ${icon ? 'left-10' : 'left-4'}
            ${isFocused || hasValue ? '-top-2.5 text-xs bg-white px-2 text-blue-600' : 'top-3.5 text-base text-gray-500'}
            ${error ? 'text-red-500' : ''}
          `}>
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        
        <input
          ref={inputRef}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isFocused ? placeholder : ''}
          disabled={disabled}
          className={`
            w-full px-4 py-3 rounded-xl border border-gray-300 bg-white
            transition-all duration-200 ease-out
            ${icon ? 'pl-10' : ''}
            ${showPasswordToggle ? 'pr-12' : ''}
            ${isFocused ? 'border-blue-500 ring-2 ring-blue-500 ring-opacity-20 input-focus' : 'hover:border-gray-400'}
            ${error ? 'border-red-500 ring-2 ring-red-500 ring-opacity-20' : ''}
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
            text-gray-900 placeholder-gray-400
          `}
          {...props}
        />
        
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={togglePassword}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      
      {label && (
        <label className={`absolute transition-all duration-200 ease-out pointer-events-none
          ${icon ? 'left-10' : 'left-4'}
          ${isFocused || hasValue ? '-top-2.5 text-xs bg-white px-2 text-blue-600' : 'top-3.5 text-base text-gray-500'}
          ${error ? 'text-red-500' : ''}
        `}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      {error && (
        <div className="mt-1 text-sm text-red-600 flex items-center animate-fadeIn">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};

export default PremiumInput;
