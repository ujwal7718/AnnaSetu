# Food Donation Platform

An online food donation platform connecting donors, NGOs, and volunteers using the MERN stack.

## Features

- **User Roles**: Donors, Volunteers, and NGO Admin
- **Location-based Filtering**: Donations within 5km radius for volunteers
- **Real-time Assignment**: NGO admin can assign volunteers to donations
- **Status Tracking**: Track donation status from pending to delivered
- **Geolocation Support**: Automatic location detection for donors and volunteers

## Technology Stack

- **Frontend**: React, React Router, Axios, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (installed and running)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd food-donation-platform
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/food-donation
   JWT_SECRET=your_jwt_secret_key_here_change_in_production
   NODE_ENV=development
   ```

5. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

6. **Run the application**
   
   For development (runs both backend and frontend):
   ```bash
   npm run dev
   ```
   
   Or run separately:
   ```bash
   # Backend
   npm run server
   
   # Frontend (in another terminal)
   npm run client
   ```

## Usage

### Registration
1. Navigate to `/register`
2. Select your role (Donor, Volunteer, or Admin)
3. Fill in your details including location coordinates
4. Use "Get Current Location" button for automatic coordinates

### Donor Workflow
1. Register as a donor
2. Create food donations with details about food type, quantity, and pickup time
3. Track donation status in your dashboard
4. View assigned volunteer information

### Volunteer Workflow
1. Register as a volunteer
2. Toggle availability status
3. View available donations within 5km radius
4. Accept donations and update status (picked/delivered)

### Admin Workflow
1. Register as an admin
2. View dashboard statistics
3. Assign volunteers to pending donations
4. Monitor all donations and user activities

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Donations
- `POST /api/donations` - Create new donation (donor only)
- `GET /api/donations/my-donations` - Get donor's donations
- `GET /api/donations/available` - Get available donations (volunteer only)
- `PATCH /api/donations/:id/accept` - Accept donation (volunteer only)
- `PATCH /api/donations/:id/status` - Update donation status (volunteer only)

### Volunteers
- `GET /api/volunteers` - Get all volunteers (admin only)
- `GET /api/volunteers/my-assignments` - Get volunteer's assignments
- `PATCH /api/volunteers/availability` - Update availability

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/donations` - Get all donations
- `PATCH /api/admin/donations/:id/assign` - Assign volunteer to donation
- `GET /api/admin/users` - Get all users

## Database Schema

### User Model
- name, email, password, phone
- role (donor/volunteer/admin)
- location (coordinates and address)
- isAvailable (for volunteers)

### Donation Model
- donor reference
- food details (type, quantity, description)
- pickup information (time, location)
- status tracking
- volunteer assignment

## Location Features

The platform uses geospatial queries to:
- Find donations within 5km of volunteer location
- Calculate distances between users
- Support location-based filtering

## Security Features

- **Admin Access Control**: Admin registration is disabled for public signup
- **Admin Creation**: Admin accounts can only be created via server-side script
- **JWT-based Authentication**: Secure token-based authentication
- **Password Hashing**: All passwords are hashed using bcryptjs
- **Role-based Access Control**: Different access levels for different user types
- **Input Validation**: Server-side validation for all inputs

## Admin Account Setup

For security reasons, admin registration is disabled in the public signup form. To create an admin account:

1. **Run the admin creation script**:
   ```bash
   npm run create-admin
   ```

2. **Default Admin Credentials**:
   - Email: `admin@fooddonation.com`
   - Password: `admin123`

3. **Important**: Change the default password after first login!

4. **Admin Features**:
   - View dashboard statistics
   - Manage all donations
   - Assign volunteers to donations
   - View all users

## Development

### Project Structure
```
food-donation-platform/
├── server/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication middleware
│   └── index.js         # Server entry point
├── client/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/     # React context
│   │   └── App.js       # Main app component
│   └── public/
├── package.json
└── README.md
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
