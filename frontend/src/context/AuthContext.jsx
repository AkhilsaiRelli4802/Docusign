import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:5000/api';

  useEffect(() => {
    const token = localStorage.getItem('documind_token');
    const savedUser = localStorage.getItem('documind_user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    const { token, user: userData } = res.data;
    
    localStorage.setItem('documind_token', token);
    localStorage.setItem('documind_user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    return userData;
  };

  const signup = async (email, password, openaiKey) => {
    const res = await axios.post(`${API_URL}/auth/signup`, { email, password, openaiKey });
    const { token, user: userData } = res.data;
    
    localStorage.setItem('documind_token', token);
    localStorage.setItem('documind_user', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('documind_token');
    localStorage.removeItem('documind_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateOpenAIKey = async (openaiKey) => {
    await axios.put(`${API_URL}/auth/openai-key`, { openaiKey });
    const updatedUser = { ...user, hasKey: true };
    localStorage.setItem('documind_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, updateOpenAIKey }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
