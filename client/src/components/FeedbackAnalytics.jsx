import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, TrendingUp } from 'lucide-react';
import axios from 'axios';

const FeedbackAnalytics = ({ userId, feedbackType = null }) => {
  const [analytics, setAnalytics] = useState({
    averageRating: 0,
    totalReviews: 0,
    fiveStarCount: 0,
    feedback: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');

        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const config = {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };

        let url = `http://localhost:5001/api/feedback/${userId}`;
        if (feedbackType) {
          url += `?type=${feedbackType}`;
        }

        const response = await axios.get(url, config);

        // Calculate 5-star count
        const fiveStarCount = response.data.feedback?.filter(f => f.rating === 5).length || 0;

        setAnalytics({
          averageRating: response.data.averageRating || 0,
          totalReviews: response.data.count || response.data.feedback?.length || 0,
          fiveStarCount,
          feedback: response.data.feedback || []
        });
      } catch (err) {
        console.error('Error fetching feedback analytics:', err);
        setError(err.response?.data?.message || 'Failed to load feedback');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchFeedback();
    } else {
      setLoading(false);
    }
  }, [userId, feedbackType]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">Unable to load feedback</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average Rating */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-100 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Average Rating</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.averageRating}</p>
              <p className="text-xs text-gray-500 mt-1">out of 5.0</p>
            </div>
            <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= Math.round(analytics.averageRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Total Reviews */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Total Reviews</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalReviews}</p>
              <p className="text-xs text-gray-500 mt-1">feedback received</p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        {/* 5-Star Reviews */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-1">5-Star Reviews</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.fiveStarCount}</p>
              <p className="text-xs text-gray-500 mt-1">
                {analytics.totalReviews > 0
                  ? `${Math.round((analytics.fiveStarCount / analytics.totalReviews) * 100)}% of total`
                  : 'no ratings yet'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Recent Feedback */}
      {analytics.feedback.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Feedback</h3>
            <p className="text-sm text-gray-500 mt-1">Latest {Math.min(5, analytics.feedback.length)} reviews</p>
          </div>

          <div className="divide-y divide-gray-200">
            {analytics.feedback.slice(0, 5).map((review) => (
              <div key={review._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                {/* Header with Rating and Date */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {renderStars(review.rating)}
                    <span className="text-sm font-semibold text-gray-700">{review.rating}.0</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Reviewer Info */}
                <div className="mb-2 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {review.donor?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {review.donor?.name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {review.feedbackType === 'donor-to-ngo'
                        ? 'Donor → NGO'
                        : review.feedbackType === 'donor-to-volunteer'
                        ? 'Donor → Volunteer'
                        : 'NGO → Volunteer'}
                    </p>
                  </div>
                </div>

                {/* Comment */}
                {review.comment && (
                  <p className="text-sm text-gray-700 bg-gray-50 rounded p-3 mt-3">
                    "{review.comment}"
                  </p>
                )}

                {/* Food Type */}
                {review.donation?.foodType && (
                  <p className="text-xs text-gray-500 mt-2 capitalize">
                    📦 {review.donation.foodType}
                  </p>
                )}
              </div>
            ))}
          </div>

          {analytics.feedback.length > 5 && (
            <div className="px-6 py-4 bg-gray-50 text-center">
              <p className="text-sm text-gray-600">
                +{analytics.feedback.length - 5} more feedback
              </p>
            </div>
          )}
        </div>
      )}

      {/* No Feedback State */}
      {analytics.feedback.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium mb-1">No feedback yet</p>
          <p className="text-sm text-gray-500">
            Feedback will appear here once you receive reviews from donors or NGOs.
          </p>
        </div>
      )}
    </div>
  );
};

export default FeedbackAnalytics;
