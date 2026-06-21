import React from 'react';

const ImageModal = ({ isOpen, onClose, imageSrc, altText }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="relative max-w-4xl max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <img
          src={imageSrc}
          alt={altText}
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
        />
        
        <div className="absolute bottom-4 left-4 bg-white rounded-lg px-4 py-2 shadow-lg">
          <p className="text-sm text-gray-700">{altText}</p>
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
