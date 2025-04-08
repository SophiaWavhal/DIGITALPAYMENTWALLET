import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/NavMenu.css';

const NavMenu = ({ user, handleLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = async () => {
    try {
      await handleLogout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          EasyPay
        </Link>
        
        <div className="navbar-links">
          <Link 
            to="/dashboard" 
            className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/send-money" 
            className={`nav-link ${location.pathname === '/send-money' ? 'active' : ''}`}
          >
            Send Money
          </Link>
          <Link 
            to="/bill-payments" 
            className={`nav-link ${location.pathname === '/bill-payments' ? 'active' : ''}`}
          >
            Bill Payments
          </Link>
          <Link 
            to="/transactions" 
            className={`nav-link ${location.pathname === '/transactions' ? 'active' : ''}`}
          >
            History
          </Link>
        </div>
        
        <div className="navbar-actions">
          <Link to="/profile" className="profile-link">
            <span className="profile-icon">👤</span>
            <span className="profile-name">{user?.name || 'Profile'}</span>
          </Link>
          <button onClick={handleLogoutClick} className="logout-button">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavMenu;