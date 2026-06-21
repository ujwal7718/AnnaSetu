import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const CalendarIntegration = ({ donation, volunteerSchedule }) => {
  const [selectedCalendar, setSelectedCalendar] = useState('google');
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (volunteerSchedule) {
      fetchCalendarEvents();
    }
  }, [volunteerSchedule]);

  const fetchCalendarEvents = async () => {
    try {
      const response = await fetch('/api/calendar/events');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    }
  };

  // Generate calendar event for donation pickup
  const generateCalendarEvent = () => {
    const pickupDate = new Date(donation.pickupDate);
    const duration = 30; // 30 minutes for pickup
    const endDate = new Date(pickupDate.getTime() + duration * 60000);

    return {
      title: `ANNASETU Food Pickup - ${donation.foodType}`,
      description: `
Food Pickup Details:
• Food Type: ${donation.quantity} of ${donation.foodType}
• Donor: ${donation.donorName}
• Address: ${donation.address}
• Contact: ${donation.donorPhone}
• Instructions: ${donation.instructions || 'None'}

Thank you for volunteering with ANNASETU! 🍱
      `.trim(),
      location: donation.address,
      startTime: pickupDate.toISOString(),
      endTime: endDate.toISOString(),
      reminder: 15, // 15 minutes before
    };
  };

  // Google Calendar integration
  const addToGoogleCalendar = async () => {
    setLoading(true);
    try {
      const event = generateCalendarEvent();
      
      // Create Google Calendar event
      const response = await fetch('/api/calendar/google/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: event.title,
          description: event.description,
          location: event.location,
          start: {
            dateTime: event.startTime,
            timeZone: 'Asia/Kolkata',
          },
          end: {
            dateTime: event.endTime,
            timeZone: 'Asia/Kolkata',
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: event.reminder },
              { method: 'popup', minutes: event.reminder },
            ],
          },
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Open Google Calendar event in new tab
        window.open(result.eventUrl, '_blank');
      } else {
        alert('Failed to add to Google Calendar');
      }
    } catch (error) {
      console.error('Google Calendar error:', error);
      alert('Error adding to Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  // Outlook Calendar integration
  const addToOutlookCalendar = async () => {
    setLoading(true);
    try {
      const event = generateCalendarEvent();
      
      // Create Outlook calendar event URL
      const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}&startdt=${event.startTime}&enddt=${event.endTime}`;
      
      window.open(outlookUrl, '_blank');
    } catch (error) {
      console.error('Outlook Calendar error:', error);
      alert('Error adding to Outlook Calendar');
    } finally {
      setLoading(false);
    }
  };

  // Generate .ics file for other calendars
  const generateICSFile = () => {
    const event = generateCalendarEvent();
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ANNASETU//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:${donation._id}@annasetu.org`,
      `DTSTART:${event.startTime.replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `DTEND:${event.endTime.replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
      `LOCATION:${event.location}`,
      `BEGIN:VALARM`,
      `TRIGGER:-PT${event.reminder}M`,
      `DESCRIPTION:Pickup Reminder`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `annasetu-pickup-${donation._id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Check for scheduling conflicts
  const checkScheduleConflict = (newEventStart) => {
    const newEventEnd = new Date(new Date(newEventStart).getTime() + 30 * 60000);
    
    return events.some(event => {
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);
      
      return (
        (newEventStart >= eventStart && newEventStart < eventEnd) ||
        (newEventEnd > eventStart && newEventEnd <= eventEnd) ||
        (newEventStart <= eventStart && newEventEnd >= eventEnd)
      );
    });
  };

  const hasConflict = donation.pickupDate && checkScheduleConflict(donation.pickupDate);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Pickup</h3>
      
      {hasConflict && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4"
        >
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-yellow-800 text-sm font-medium">
              Schedule conflict detected! You have another event at this time.
            </span>
          </div>
        </motion.div>
      )}

      <div className="mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Pickup Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-600">Date: {new Date(donation.pickupDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-600">Time: {new Date(donation.pickupDate).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-600">Location: {donation.address}</span>
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-600">Duration: 30 minutes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Choose Calendar</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'google', name: 'Google Calendar', icon: '📅', color: 'border-blue-500 bg-blue-50' },
            { id: 'outlook', name: 'Outlook Calendar', icon: '📆', color: 'border-purple-500 bg-purple-50' },
            { id: 'apple', name: 'Apple Calendar', icon: '🍎', color: 'border-gray-500 bg-gray-50' },
            { id: 'other', name: 'Other Calendar', icon: '📋', color: 'border-green-500 bg-green-50' },
          ].map((calendar) => (
            <motion.button
              key={calendar.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCalendar(calendar.id)}
              className={`p-3 border-2 rounded-lg transition-all ${
                selectedCalendar === calendar.id
                  ? calendar.color
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{calendar.icon}</div>
                <div className="text-sm font-medium text-gray-900">{calendar.name}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (selectedCalendar === 'google') addToGoogleCalendar();
            else if (selectedCalendar === 'outlook') addToOutlookCalendar();
            else if (selectedCalendar === 'apple' || selectedCalendar === 'other') generateICSFile();
          }}
          disabled={loading || hasConflict}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V8C4 3.589 7.589 0 12 0s8 3.589 8 8v4z"></path>
              </svg>
              Adding to Calendar...
            </span>
          ) : (
            `Add to ${selectedCalendar === 'google' ? 'Google' : selectedCalendar === 'outlook' ? 'Outlook' : 'Calendar'}`
          )}
        </motion.button>

        <div className="text-center text-xs text-gray-500">
          <p>📱 Automatic reminders will be set 15 minutes before pickup</p>
          <p className="mt-1">🔄 You can reschedule anytime from your calendar</p>
        </div>
      </div>

      {events.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-semibold text-gray-900 mb-3">Upcoming Pickups</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {events.slice(0, 3).map((event) => (
              <div key={event.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{event.summary}</p>
                    <p className="text-xs text-gray-600">
                      {new Date(event.start.dateTime).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarIntegration;
