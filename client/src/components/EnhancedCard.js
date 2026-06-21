import React from 'react';
import { motion } from 'framer-motion';

const EnhancedCard = ({ 
  children, 
  className = "", 
  hover = true,
  image = null,
  overlay = false,
  rounded = "rounded-2xl"
}) => {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -2 } : {}}
      className={`
        relative overflow-hidden
        ${rounded}
        shadow-lg hover:shadow-xl
        transition-all duration-300
        ${className}
      `}
    >
      {image && (
        <div className="absolute inset-0">
          {image}
          {overlay && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          )}
        </div>
      )}
      <div className={`relative z-10 ${image ? 'text-white' : ''}`}>
        {children}
      </div>
    </motion.div>
  );
};

export default EnhancedCard;
