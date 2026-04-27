import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import HubPage from './pages/HubPage';
import LandingPage from './pages/LandingPage'; // role-selector, reached from hub via /login/student
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UploadDocument from './pages/UploadDocument';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <Routes>
      <Route
        path="/login/student"
        element={
          isAuthenticated ? (
            <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
          ) : (
            <Login mode="student" />
          )
        }
      />

      <Route
        path="/login/admin"
        element={
          isAuthenticated ? (
            <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
          ) : (
            <Login mode="admin" />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <UploadDocument />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly={true}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Unified hub — entry point when unauthenticated */}
      <Route
        path="/hub"
        element={isAuthenticated ? <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace /> : <HubPage />}
      />

      {/* JayPrint role selector — reached from hub */}
      <Route
        path="/select-role"
        element={isAuthenticated ? <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace /> : <LandingPage />}
      />

      {/* Root redirects to hub or dashboard */}
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace /> : <Navigate to="/hub" replace />}
      />

      {/* Redirect legacy /login to /login/student if accessed directly */}
      <Route path="/login" element={<Navigate to="/login/student" replace />} />

      <Route path="*" element={<Navigate to="/hub" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
