const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

// Socket.io authentication middleware
const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    next(new Error('Invalid authentication token'));
  }
};

// Initialize Socket.io
const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Use authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.userId} (${socket.userRole})`);

    // Join user to role-based room
    socket.join(socket.userRole);
    
    // Join user to personal room
    socket.join(`user_${socket.userId}`);

    // Handle donation creation events
    socket.on('donation:created', (data) => {
      console.log('📦 New donation created:', data);
      
      // Notify all NGOs about new donation
      io.to('ngo').emit('new:donation', {
        type: 'new_donation',
        donation: data,
        timestamp: new Date().toISOString(),
        message: `New food donation available in ${data.location.address || 'your area'}`
      });
    });

    // Handle volunteer assignment events
    socket.on('volunteer:assigned', (data) => {
      console.log('🚚 Volunteer assigned:', data);
      
      // Notify specific volunteer
      io.to(`user_${data.volunteerId}`).emit('assignment:notification', {
        type: 'assignment',
        donation: data.donation,
        timestamp: new Date().toISOString(),
        message: `You've been assigned to deliver food donation`
      });
    });

    // Handle donation status updates
    socket.on('donation:status', (data) => {
      console.log('📊 Donation status updated:', data);
      
      // Notify relevant users
      if (data.status === 'assigned_to_volunteer') {
        io.to('ngo').emit('donation:assigned', {
          type: 'donation_assigned',
          donation: data.donation,
          volunteer: data.volunteer,
          timestamp: new Date().toISOString()
        });
      } else if (data.status === 'completed') {
        io.to('ngo').emit('donation:completed', {
          type: 'donation_completed',
          donation: data.donation,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle volunteer location updates
    socket.on('volunteer:location', (data) => {
      console.log('📍 Volunteer location updated:', data);
      
      // Notify NGOs about volunteer availability
      io.to('ngo').emit('volunteer:location', {
        type: 'location_update',
        volunteerId: socket.userId,
        location: data.location,
        timestamp: new Date().toISOString()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.userId} (${socket.userRole})`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
    });
  });

  return io;
};

// Emit donation creation event
const emitDonationCreated = (donation) => {
  if (io) {
    io.emit('donation:created', {
      type: 'donation_created',
      donation,
      timestamp: new Date().toISOString(),
      message: `New donation posted: ${donation.foodType}`
    });
  }
};

// Emit volunteer assignment
const emitVolunteerAssigned = (volunteerId, donation) => {
  if (io) {
    io.to(`user_${volunteerId}`).emit('volunteer:assigned', {
      type: 'volunteer_assigned',
      donation,
      timestamp: new Date().toISOString(),
      message: 'You have been assigned to a new donation delivery'
    });
  }
};

// Emit NGO notification
const emitNGONotification = (message, type = 'info') => {
  if (io) {
    io.to('ngo').emit('ngo:notification', {
      type,
      message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  initializeSocket,
  emitDonationCreated,
  emitVolunteerAssigned,
  emitNGONotification
};
