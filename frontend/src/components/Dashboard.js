import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';

const Dashboard = ({ user, transactions, updateBalance }) => {
  const [balance, setBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        if (response.data?.user?.balance !== undefined) {
          setBalance(response.data.user.balance);
        }
        
        if (transactions) {
          setRecentTransactions(transactions.slice(0, 3));
        } else {
          const txResponse = await axios.get('/api/transactions/history?limit=3');
          if (txResponse.data?.transactions) {
            setRecentTransactions(txResponse.data.transactions);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [transactions]);

  if (!user) {
    return <div className="dashboard">User data not available</div>;
  }

  return (
    <div className="dashboard">
      <div className="welcome-banner">
        <h1>Welcome back, {user.name || 'User'}!</h1>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="dashboard-content">
          <div className="balance-card">
            <h2>Your Wallet Balance</h2>
            <div className="balance-amount">₹{balance.toFixed(2)}</div>
            <div className="balance-actions">
              <Link to="/send-money" className="button">Send Money</Link>
              <Link to="/add-money" className="button secondary">Add Money</Link>
            </div>
          </div>

          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-grid">
              {[
                { name: 'Send Money', icon: '💰', path: '/send-money' },
                { name: 'Pay Bills', icon: '🧾', path: '/bill-payments' },
                { name: 'Scan QR', icon: '📷', path: '/qr-scanner' },
                { name: 'My QR', icon: '🔳', path: '/qr-generator' },
                { name: 'Bank Transfer & Bank Balance', icon: '🏦', path: '/bank-transfer' },
                { name: 'Create Account', icon: '📝', path: '/create-account' },
                { name: 'Offers', icon: '🎁', path: '/offers' },
                { name: 'Notifications', icon: '🔔', path: '/notifications' },
                { name: 'Split Money', icon: '🤝', path: '/split-money' }

                
              ].map((action, i) => (
                <Link to={action.path} key={i} className="action-card">
                  <div className="action-icon">{action.icon}</div>
                  <div className="action-name">{action.name}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="recent-transactions">
            <h2>Recent Transactions</h2>
            {recentTransactions.length > 0 ? (
              <>
                {recentTransactions.map(t => (
                  <div key={t._id || Math.random()} className="transaction-item">
                    <div className="transaction-info">
                      <div className="transaction-name">{t.description || 'Transaction'}</div>
                      <div className="transaction-date">
                        {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '--/--/----'}
                      </div>
                    </div>
                    <div className={`transaction-amount ${t.amount > 0 ? 'credit' : 'debit'}`}>
                      {t.amount > 0 ? '+' : '-'}₹{Math.abs(t.amount || 0).toFixed(2)}
                    </div>
                  </div>
                ))}
                <Link to="/transactions" className="view-all">View All Transactions →</Link>
              </>
            ) : (
              <p>No recent transactions</p>
            )}
          </div>

          {user.role === 'admin' && (
            <div className="admin-panel">
              <h2>Admin Panel</h2>
              <div className="admin-actions">
                {[
                  { name: 'Manage Users', icon: '👥', path: '/admin/users' },
                  { name: 'View Transactions', icon: '📊', path: '/admin/transactions' }
                ].map((action, i) => (
                  <Link to={action.path} key={i} className="admin-card">
                    <div className="admin-icon">{action.icon}</div>
                    <div className="admin-action-name">{action.name}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;