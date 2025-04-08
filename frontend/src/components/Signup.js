import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Signup.css';

const Signup = ({ onSignup }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation checks here...

    try {
      const response = await axios.post('/api/auth/signup', {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone,
        password: formData.password
      });

      if (response.data.success) {
        setSignupSuccess(true);
        setTimeout(() => {
          if (typeof onSignup === 'function') {
            onSignup(response.data.user);
          }
          navigate('/login');
        }, 2000); // Redirect after 2 seconds
      } else {
        throw new Error(response.data.message || 'Signup failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (signupSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-success">
            <h2>Account Created Successfully!</h2>
            <p>Your account has been created. Redirecting to login...</p>
            <div className="success-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create Your Account</h2>
          <p>Join thousands of users who trust us with their payments</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              pattern="[A-Za-z ]+"
              title="Name should only contain letters and spaces"
            />
          </div>
          
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter 10-digit phone number"
              pattern="[0-9]{10}"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password (min 6 characters)"
              minLength="6"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              minLength="6"
              required
            />
          </div>
          
          <div className="form-checkbox">
            <input
              type="checkbox"
              id="agreeToTerms"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              required
            />
            <label htmlFor="agreeToTerms">
              I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
            </label>
          </div>
          
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? (
              <>
                <span className="auth-spinner"></span> Creating Account...
              </>
            ) : 'Create Account'}
          </button>
        </form>
        
        <div className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Log in</Link>
        </div>
      </div>
    </div>
  );
};



export default Signup;