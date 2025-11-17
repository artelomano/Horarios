/**
 * Main App Component
 * Handles routing and authentication
 */
import React, { useState, useEffect } from 'react';
import { authAPI } from './services/api.js';
import LoginPage from './pages/LoginPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import PublicPage from './pages/PublicPage.jsx';
import './styles/index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    // Check if we're on public page
    if (window.location.pathname === '/public.html' || window.location.pathname === '/public') {
      setIsPublic(true);
      setLoading(false);
    }
  }, []);

  const checkAuth = async () => {
    try {
      const response = await authAPI.check();
      setIsAuthenticated(response.authenticated);
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (username, password) => {
    try {
      await authAPI.login(username, password);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (isPublic) {
    return <PublicPage />;
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <AdminPage onLogout={handleLogout} />;
}

export default App;

