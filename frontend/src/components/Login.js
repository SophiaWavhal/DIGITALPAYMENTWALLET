import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Login.css';

const Login = ({ handleLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password
      });

      if (response.data?.success) {
        if (typeof handleLogin === 'function') {
          await handleLogin(response.data);
        }

        navigate('/dashboard', { replace: true });
        window.location.pathname = '/dashboard';
      } else {
        throw new Error(response.data?.message || 'Login failed');
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="glass-card">
        <h2 className="glass-title">🔐 Sign In to EasyPay</h2>
        <p className="glass-subtitle">Welcome back! Please enter your credentials</p>

        {error && <div className="glass-error">{error}</div>}

        <form onSubmit={handleSubmit} className="glass-form">
          <div className="glass-input-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder=" "
            />
            <label>Email Address</label>
          </div>

          <div className="glass-input-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder=" "
            />
            <label>Password</label>
          </div>

          <button type="submit" className="glass-button" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span> Logging in...
              </>
            ) : 'Login'}
          </button>
        </form>

        <div className="glass-footer">
          New here? <Link to="/signup">Create an account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
