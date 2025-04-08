import React, { useState, useEffect } from 'react';
import '../styles/Profile.css';

const Profile = ({ user, setUser }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Profile updated successfully!');
        setUser(data.user);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <h2>Your Profile</h2>
      
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled
          />
        </div>
        
        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label>Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows="3"
          />
        </div>
        
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        
        <button type="submit" disabled={loading} className="save-button">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
      
      <div className="security-section">
        <h3>Security</h3>
        <button className="change-password">Change Password</button>
        <button className="two-factor">Two-Factor Authentication</button>
      </div>
      
      <div className="account-actions">
        <h3>Account Actions</h3>
        <button className="logout-all">Logout from All Devices</button>
        <button className="delete-account">Delete Account</button>
      </div>
    </div>
  );
};

export default Profile;