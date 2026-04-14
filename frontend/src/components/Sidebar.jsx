import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { MessageSquare, Files, LogOut, BrainCircuit, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Sidebar = ({ isLocked }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: <MessageSquare size={20} />, label: 'Chat Agent' },
    { path: '/documents', icon: <Files size={20} />, label: 'Documents' },
  ];

  return (
    <div className="sidebar glass">
      <div className="sidebar-logo">
        <BrainCircuit className="logo-icon" size={32} />
        <span className="brand-font logo-text">DocuMind</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={isLocked ? '#' : item.path} 
            className={({ isActive }) => `nav-item ${isActive && !isLocked ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
            onClick={(e) => {
              if (isLocked) e.preventDefault();
            }}
          >
            {item.icon}
            <span>{item.label}</span>
            {isLocked && <Lock size={14} className="nav-lock-icon" style={{ marginLeft: 'auto', opacity: 0.5 }} />}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">{user?.email?.[0].toUpperCase() || 'U'}</div>
          <div className="user-info">
            <span className="user-email">{user?.email}</span>
          </div>
        </div>
        
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
