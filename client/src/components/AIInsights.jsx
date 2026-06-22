import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const AIInsights = ({ ngoId }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    console.log(`🔍 [AIInsights] Component mounted/updated with ngoId: ${ngoId}`);
    if (ngoId) {
      fetchAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ngoId]);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`📡 [AIInsights] Fetching analysis for ngoId: ${ngoId}`);

      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const url = `${API_BASE_URL}/api/feedback-analysis/${ngoId}`;
      console.log(`   Request URL: ${url}`);
      console.log(`   Token present: ${!!token}`);

      const response = await axios.get(url, config);

      console.log(`   ✅ Response received:`, response.data);

      if (response.data.success) {
        console.log(`   ✅ Analysis data set successfully`);
        setAnalysis(response.data.data);
      } else {
        console.log(`   ⚠️  API returned success: false - ${response.data.message}`);
        setError(response.data.message);
      }
    } catch (err) {
      console.error('❌ Error fetching AI insights:', err);
      console.error(`   Status: ${err.response?.status}`);
      console.error(`   Data: `, err.response?.data);
      setError(err.response?.data?.message || 'Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      setError(null);

      console.log(`🔄 [AIInsights] Regenerating analysis for ngoId: ${ngoId}`);

      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const url = `${API_BASE_URL}/api/feedback-analysis/${ngoId}/regenerate`;
      console.log(`   Request URL: ${url}`);

      const response = await axios.post(url, {}, config);

      console.log(`   ✅ Response received:`, response.data);

      if (response.data.success) {
        console.log(`   ✅ Analysis regenerated successfully`);
        setAnalysis(response.data.data);
      } else {
        console.log(`   ⚠️  Regeneration failed - ${response.data.message}`);
        setError(response.data.message);
      }
    } catch (err) {
      console.error('❌ Error regenerating AI insights:', err);
      console.error(`   Status: ${err.response?.status}`);
      console.error(`   Data: `, err.response?.data);
      setError(err.response?.data?.message || 'Failed to regenerate insights');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">AI Insights</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
            <button
              onClick={fetchAnalysis}
              className="text-sm text-blue-600 hover:text-blue-700 mt-3 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'Positive':
        return 'bg-green-50 border-green-200';
      case 'Negative':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const getSentimentBadgeColor = (sentiment) => {
    switch (sentiment) {
      case 'Positive':
        return 'bg-green-100 text-green-700';
      case 'Negative':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
          title="Refresh AI analysis"
        >
          <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
          {regenerating ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      {/* Sentiment Badge */}
      <div className={`border rounded-xl p-6 ${getSentimentColor(analysis.sentiment)}`}>
        <p className="text-sm font-semibold text-gray-600 mb-2">Overall Sentiment</p>
        <div className={`inline-block px-4 py-2 rounded-lg font-semibold ${getSentimentBadgeColor(analysis.sentiment)}`}>
          {analysis.sentiment}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-sm font-semibold text-gray-900 mb-3">Summary</p>
        <p className="text-sm text-gray-700 leading-relaxed">
          {analysis.summary || 'No summary available'}
        </p>
      </div>

      {/* Strengths */}
      {analysis.strengths && analysis.strengths.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-green-600" />
            <p className="text-sm font-semibold text-gray-900">Top Strengths</p>
          </div>
          <ul className="space-y-2">
            {analysis.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span className="text-sm text-gray-700">{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Areas for Improvement */}
      {analysis.improvements && analysis.improvements.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <p className="text-sm font-semibold text-gray-900">Areas for Improvement</p>
          </div>
          <ul className="space-y-2">
            {analysis.improvements.map((improvement, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-orange-600 font-bold mt-0.5">→</span>
                <span className="text-sm text-gray-700">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-500 text-center">
        {analysis.lastAnalyzedAt && (
          <p>Last analyzed: {new Date(analysis.lastAnalyzedAt).toLocaleDateString()}</p>
        )}
        {analysis.feedbackCount && (
          <p>Based on {analysis.feedbackCount} feedback entries</p>
        )}
      </div>
    </div>
  );
};

export default AIInsights;
