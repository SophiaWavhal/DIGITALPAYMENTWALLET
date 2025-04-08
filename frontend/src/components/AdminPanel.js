import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AdminPanel.css';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/admin/${activeTab}`);
        
        if (activeTab === 'users') {
          setUsers(response.data.users);
        } else {
          setTransactions(response.data.transactions);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const toggleUserStatus = async (userId) => {
    try {
      await axios.put(`/api/admin/users/${userId}/toggle-status`);
      setUsers(users.map(user => 
        user._id === userId ? { ...user, isActive: !user.isActive } : user
      ));
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  return (
    <div className="admin-panel">
      <div className="tabs">
        <button 
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button 
          className={activeTab === 'transactions' ? 'active' : ''}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : activeTab === 'users' ? (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button onClick={() => toggleUserStatus(user._id)}>
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="transactions-table">
          <table>
            <thead>
              <tr>
                <th>Amount</th>
                <th>Type</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx._id}>
                  <td>₹{tx.amount}</td>
                  <td>{tx.type}</td>
                  <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                  <td>{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;