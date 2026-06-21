import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const RealTimeNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      console.log('RealTimeNotifications: No user found, skipping socket connection');
      return;
    }

    console.log('RealTimeNotifications: Initializing socket for user:', user);
    console.log('RealTimeNotifications: User role:', user.role);

    // Initialize socket connection
    const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5001', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.on('connect', () => {
      console.log('RealTimeNotifications: Connected to real-time notifications');
      console.log('RealTimeNotifications: Socket ID:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      console.log('RealTimeNotifications: Disconnected from real-time notifications');
    });

    newSocket.on('connect_error', (error) => {
      console.error('RealTimeNotifications: Connection error:', error);
    });

    // Listen for new donations (for NGOs)
    newSocket.on('new:donation', (data) => {
      console.log('📦 New donation notification:', data);
      
      setNotifications(prev => [
        {
          id: Date.now(),
          type: 'new_donation',
          title: 'New Food Donation Available',
          message: data.message || `New donation posted: ${data.donation.foodType}`,
          donation: data.donation,
          timestamp: data.timestamp,
          read: false
        },
        ...prev
      ]);
    });

    // Listen for volunteer assignments
    newSocket.on('assignment:notification', (data) => {
      console.log('🚚 Volunteer assignment notification:', data);
      
      setNotifications(prev => [
        {
          id: Date.now(),
          type: 'assignment',
          title: 'New Assignment',
          message: data.message || 'You have been assigned to deliver food',
          donation: data.donation,
          timestamp: data.timestamp,
          read: false
        },
        ...prev
      ]);
    });

    // Listen for NGO notifications
    newSocket.on('ngo:notification', (data) => {
      console.log('🏢 NGO notification:', data);
      
      setNotifications(prev => [
        {
          id: Date.now(),
          type: 'ngo_notification',
          title: 'System Notification',
          message: data.message,
          timestamp: data.timestamp,
          read: false
        },
        ...prev
      ]);
    });

    // Listen for donation status updates
    newSocket.on('donation:assigned', (data) => {
      console.log('📊 Donation assigned:', data);
      
      setNotifications(prev => [
        {
          id: Date.now(),
          type: 'donation_assigned',
          title: 'Donation Assigned',
          message: `Donation assigned to volunteer: ${data.volunteer?.name || 'Unknown'}`,
          donation: data.donation,
          volunteer: data.volunteer,
          timestamp: data.timestamp,
          read: false
        },
        ...prev
      ]);
    });

    newSocket.on('donation:completed', (data) => {
      console.log('✅ Donation completed:', data);
      
      setNotifications(prev => [
        {
          id: Date.now(),
          type: 'donation_completed',
          title: 'Donation Completed',
          message: `Food donation has been delivered successfully`,
          donation: data.donation,
          timestamp: data.timestamp,
          read: false
        },
        ...prev
      ]);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from real-time notifications');
    });

    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user]);

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-h-96">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Real-time Notifications
            </h3>
            <button
              onClick={clearNotifications}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear All
            </button>
          </div>
        </div>
        
        <div className="max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="text-2xl mb-2">🔔</div>
              <p>No notifications</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    notification.read ? 'bg-white' : 'bg-blue-50'
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {notification.type === 'new_donation' && <span className="text-2xl">📦</span>}
                      {notification.type === 'assignment' && <span className="text-2xl">🚚</span>}
                      {notification.type === 'ngo_notification' && <span className="text-2xl">🏢</span>}
                      {notification.type === 'donation_assigned' && <span className="text-2xl">📊</span>}
                      {notification.type === 'donation_completed' && <span className="text-2xl">✅</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {notification.title}
                        </div>
                        <div className="text-gray-600">
                          {notification.message}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(notification.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {unreadCount > 0 && (
          <div className="p-2 bg-blue-600 text-white text-center">
            <span className="text-sm font-medium">
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RealTimeNotifications;
