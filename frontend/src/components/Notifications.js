import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Notifications.css';

const Notifications = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get('/api/user/notifications');
        setNotifications(response.data.notifications || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/user/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => 
        n._id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  return (
    <div className="notifications-container">
      <h2>Notifications</h2>
      
      {loading ? (
        <div className="loading">Loading notifications...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="no-notifications">No notifications found</div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div 
              key={notification._id} 
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              onClick={() => !notification.read && markAsRead(notification._id)}
            >
              <div className="notification-content">
                <h3 className="notification-title">{notification.title}</h3>
                <p className="notification-message">{notification.message}</p>
                <p className="notification-date">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              {!notification.read && <div className="unread-indicator"></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;