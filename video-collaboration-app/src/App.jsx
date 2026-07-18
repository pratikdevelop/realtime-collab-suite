import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Room from './pages/Room'; // Your actual meeting/video room component
import AuthCallback from './components/AuthCallback'; // Import your callback componen
import RoomContainer from './components/RoomContainer';

function AppContent() {
  const navigate = useNavigate();
  const [joining, setJoining] = useState(false);
  
  // Track auth status in state so React knows when to re-render after login
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  // Listen for changes in localStorage (like when AuthCallback saves the credentials)
  useEffect(() => {
    const handleStorageChange = () => {
      setAuthToken(localStorage.getItem('authToken'));
      setUser(JSON.parse(localStorage.getItem('user') || 'null'));
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also run a quick interval check since window storage events don't always fire on the same tab
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('authToken');
      if (currentToken !== authToken) {
        setAuthToken(currentToken);
        setUser(JSON.parse(localStorage.getItem('user') || 'null'));
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [authToken]);

  const isAuthenticated = !!authToken;

  // Define the action when joining a room
  const handleJoinCall = (roomName) => {
    setJoining(true);
    // Redirect the browser to the dedicated room page
    navigate(`/room/${roomName}`);
    setJoining(false);
  };

  return (
    <Routes>
      {/* 1. Google Auth Callback Route - MUST BE PUBLIC & ACCESSIBLE */}
      <Route 
        path="/auth/callback" 
        element={<AuthCallback />} 
      />

      {/* Public Routes */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/signup" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignUp />} 
      />

      {/* Protected Dashboard Route */}
      <Route 
        path="/dashboard" 
        element={
          isAuthenticated ? (
            <Dashboard 
              user={user} 
              onJoinCall={handleJoinCall} 
              loading={joining} 
            />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />

      {/* Protected Video Room Route */}
      {/* <Route 
        path="/room/:roomId" 
        element={isAuthenticated ? <Room user={user} /> : <Navigate to="/login" replace />} 
      />
      <Route 
  path="/room/:roomId" 
  element={isAuthenticated ? <Room user={user} /> : <Navigate to="/login" replace />} 
/> */}
<Route 
  path="/room/:roomId" 
  element={
    isAuthenticated ? (
      <RoomContainer user={user} />
    ) : (
      <Navigate to="/login" replace />
    )
  } 
/>

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

// Top level entry point wrapping AppContent in Router context
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}