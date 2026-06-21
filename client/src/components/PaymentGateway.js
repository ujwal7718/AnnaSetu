import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const PaymentGateway = ({ donationId, amount, onSuccess, onFailure }) => {
  const [loading, setLoading] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState('razorpay');

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Razorpay payment handler
  const handleRazorpayPayment = async () => {
    setLoading(true);
    
    try {
      // Create order on your backend
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount * 100, // Convert to paise
          currency: 'INR',
          donationId: donationId,
        }),
      });
      
      const order = await response.json();
      
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        name: 'ANNASETU',
        description: 'Donation for Food Rescue',
        image: '/logo.png',
        order_id: order.id,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                donationId: donationId,
              }),
            });
            
            const result = await verifyResponse.json();
            
            if (result.success) {
              onSuccess({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                amount: amount,
                gateway: 'razorpay'
              });
            } else {
              onFailure('Payment verification failed');
            }
          } catch (error) {
            onFailure('Payment verification error: ' + error.message);
          }
        },
        prefill: {
          name: 'Donor Name',
          email: 'donor@example.com',
          contact: '+919876543210',
        },
        notes: {
          address: 'Donation for food rescue',
          donation_id: donationId,
        },
        theme: {
          color: '#4F46E5',
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            onFailure('Payment cancelled');
          },
        },
      };
      
      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (error) {
      setLoading(false);
      onFailure('Payment failed: ' + error.message);
    }
  };

  // PayTM payment handler (simplified - would need PayTM SDK integration)
  const handlePayTMPayment = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/payments/paytm-initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          donationId: donationId,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Redirect to PayTM payment page
        window.location.href = result.paymentUrl;
      } else {
        onFailure('PayTM payment initiation failed');
      }
    } catch (error) {
      setLoading(false);
      onFailure('PayTM payment failed: ' + error.message);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Your Donation</h3>
      
      <div className="mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Donation Amount:</span>
            <span className="text-2xl font-bold text-gray-900">₹{amount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Platform Fee:</span>
            <span className="text-green-600">FREE</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-blue-600">₹{amount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Choose Payment Method</label>
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedGateway('razorpay')}
            className={`p-4 border-2 rounded-lg transition-all ${
              selectedGateway === 'razorpay'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900">Razorpay</h4>
              <p className="text-xs text-gray-600 mt-1">Credit/Debit Cards, UPI, NetBanking</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedGateway('paytm')}
            className={`p-4 border-2 rounded-lg transition-all ${
              selectedGateway === 'paytm'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900">PayTM</h4>
              <p className="text-xs text-gray-600 mt-1">Wallet, UPI, Cards</p>
            </div>
          </motion.button>
        </div>
      </div>

      <div className="space-y-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={selectedGateway === 'razorpay' ? handleRazorpayPayment : handlePayTMPayment}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V8C4 3.589 7.589 0 12 0s8 3.589 8 8v4z"></path>
              </svg>
              Processing Payment...
            </span>
          ) : (
            `Pay ₹${amount} with ${selectedGateway === 'razorpay' ? 'Razorpay' : 'PayTM'}`
          )}
        </motion.button>

        <div className="text-center text-xs text-gray-500">
          <p>🔒 Secure payment powered by {selectedGateway === 'razorpay' ? 'Razorpay' : 'PayTM'}</p>
          <p className="mt-1">Your payment information is encrypted and secure</p>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2h5a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2h5z" clipRule="evenodd" />
            </svg>
            <span>SSL Encrypted</span>
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 .68-.056 1.35-.166 2.002A11.954 11.954 0 0010 18.056c-2.762 0-5.285-1.15-7.074-3.006a11.954 11.954 0 01-2.66-7.051c0-.68.056-1.35.166-2.001zm1.78 4.258a.958.958 0 00.28.28l1.571 1.571a.958.958 0 001.356 0l1.571-1.571a.958.958 0 000-1.357l-1.571-1.571a.958.958 0 00-1.357 0l-.699.699a.958.958 0 00-.28.28v1.571c0 .108.018.216.053.312l3.228 3.228a.958.958 0 001.357 0l3.228-3.228a.958.958 0 00.053-.312V9.537a.958.958 0 00-.28-.28l-.699-.699a.958.958 0 00-1.357 0l-1.571 1.571a.958.958 0 000 1.357z" clipRule="evenodd" />
            </svg>
            <span>PCI Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGateway;
