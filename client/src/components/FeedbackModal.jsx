import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const FeedbackModal = ({ isOpen, onClose, donation, feedbackType, currentUserRole, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const payload = {
        donationId: donation._id,
        rating,
        comment: comment || null,
        feedbackType
      };

      await axios.post(`${API_BASE_URL}/api/feedback`, payload, config);
      
      setSuccess(true);
      
      // Call onSuccess callback immediately if provided
      if (onSuccess) {
        onSuccess(donation._id);
      }
      
      setTimeout(() => {
        onClose();
        setRating(0);
        setComment('');
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const getFeedbackTitle = () => {
    switch (feedbackType) {
      case 'donor-to-ngo':
        return 'Rate the NGO';
      case 'donor-to-volunteer':
        return 'Rate the Volunteer';
      case 'ngo-to-volunteer':
        return 'Rate the Volunteer';
      default:
        return 'Leave Feedback';
    }
  };

  const getFeedbackDescription = () => {
    switch (feedbackType) {
      case 'donor-to-ngo':
        return 'How was your experience with the NGO that received your donation?';
      case 'donor-to-volunteer':
        return 'How was the volunteer who picked up your donation?';
      case 'ngo-to-volunteer':
        return 'How did this volunteer perform on this delivery?';
      default:
        return 'Please share your feedback';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {success ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✅</div>
                <p className="text-green-700 font-medium">Thank you for your feedback!</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{getFeedbackTitle()}</h2>
                <p className="text-sm text-gray-600 mb-6">{getFeedbackDescription()}</p>

                {/* Donation Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600">Food Type</p>
                  <p className="font-semibold text-gray-900 capitalize">{donation.foodType}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {donation.quantity} {donation.unit}
                  </p>
                </div>

                {/* Rating */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Rating (1-5 stars)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            rating >= star
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Comment (Optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Share your experience..."
                    maxLength="500"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none min-h-[100px]"
                  />
                  <p className="text-xs text-gray-400 mt-1">{comment.length}/500</p>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !rating}
                    className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackModal;
