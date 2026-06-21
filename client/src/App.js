import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import VerifyEmail from './pages/VerifyEmail';
import ResetPassword from './pages/ResetPassword';
import Homepage from './pages/Homepage';
import NGOPage from './pages/NGOPage';
import DonorDashboard from './pages/DonorDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NGODashboard from './pages/NGODashboard';
import UrgentDonations from './pages/UrgentDonations';
import DemoDashboard from './pages/DemoDashboard';
import DashboardRedirect from './components/DashboardRedirect';
import Chatbot from './components/chatbot/Chatbot';
import './styles/globals.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/ngos" element={<NGOPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            {/*
              /verify-email?token=<rawToken>
              This route MUST exist and be placed BEFORE the catch-all "*" redirect.
              Without it, clicking the link in the verification email would hit the
              catch-all and redirect the user to "/" — the backend API would never
              be called and isEmailVerified would remain false in MongoDB.
            */}
            <Route path="/verify-email" element={<VerifyEmail />} />
            {/*
              /reset-password?token=<rawToken>
              Similar to verify-email, this must be placed before the catch-all redirect.
              Allows users to set a new password after requesting a password reset.
            */}
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/demo" element={<DemoDashboard />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route 
              path="/admin/urgent-donations" 
              element={
                <PrivateRoute requiredRole="admin">
                  <UrgentDonations />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/donor" 
              element={
                <PrivateRoute requiredRole="donor">
                  <DonorDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/volunteer" 
              element={
                <PrivateRoute requiredRole="volunteer">
                  <VolunteerDashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminDashboard />
                </PrivateRoute>
              } 
            />
            {/*
              /ngo — NGO dashboard.
              PrivateRoute enforces role=ngo AND approvalStatus=approved.
              Pending/rejected NGOs see NGOPendingScreen instead.
            */}
            <Route
              path="/ngo"
              element={
                <PrivateRoute requiredRole="ngo">
                  <NGODashboard />
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Chatbot />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
