import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Sidebar from './components/Sidebar';
import ApiKeyOverlay from './components/ApiKeyOverlay';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  const isLocked = !user.hasKey;

  return (
    <div className="app-container">
      <Sidebar isLocked={isLocked} />
      <main className="main-content" style={{ position: 'relative' }}>
        <div className={`content-wrapper ${isLocked ? 'locked-blur' : ''}`} style={{ height: '100%' }}>
          {children}
        </div>
        {isLocked && <ApiKeyOverlay />}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/documents" 
            element={
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
