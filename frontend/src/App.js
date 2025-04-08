import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import NavMenu from './components/NavMenu';
import SendMoney from './components/SendMoney';
import TransactionHistory from './components/TransactionHistory';
import BillPayments from './components/BillPayments';
import Profile from './components/Profile';
import Notifications from './components/Notifications';
import QRGenerator from './components/QRGenerator';
import QRScanner from './components/QRScanner';
import OfferCashback from './components/OffersCashback';
import BankTransfer from './components/BankTransfer';
import BankAccountCreation from './components/BankAccountCreation';
import AdminPanel from './components/AdminPanel';
import AddMoney from './components/AddMoney';
import SplitMoney from './components/SplitMoney';


import './index.css';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.baseURL = 'http://localhost:5000';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionUpdate, setTransactionUpdate] = useState(0); // New state for triggering updates

  const handleLogin = async (userData) => {
    try {
      if (!userData?.user?._id) {
        throw new Error('Invalid user data received');
      }
      
      setIsAuthenticated(true);
      setUser(userData.user);
      localStorage.setItem('token', userData.token);
      await fetchUserTransactions(userData.user._id);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setTransactions([]);
      localStorage.removeItem('token');
    }
  };

  const fetchUserTransactions = async (userId) => {
    try {
      const response = await axios.get('/api/transactions/history');
      if (response.data?.transactions) {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const updateBalance = (newBalance) => {
    setUser(prev => prev ? {...prev, balance: newBalance} : null);
  };

  const triggerTransactionUpdate = () => {
    setTransactionUpdate(prev => prev + 1); // Increment to trigger refresh
  };

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        if (response.data?.user?._id) {
          setIsAuthenticated(true);
          setUser(response.data.user);
          await fetchUserTransactions(response.data.user._id);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    verifyAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      fetchUserTransactions(user._id);
    }
  }, [transactionUpdate, isAuthenticated, user?._id]);

  if (loading) {
    return <div className="app-loading">Loading application...</div>;
  }

  return (
    <Router>
      <div className="app">
        {isAuthenticated && <NavMenu user={user} handleLogout={handleLogout} />}
        <Routes>
          <Route path="/login" element={
            !isAuthenticated ? <Login handleLogin={handleLogin} /> : <Navigate to="/dashboard" />} 
          />
          <Route path="/signup" element={
            !isAuthenticated ? <Signup /> : <Navigate to="/dashboard" />} 
          />
          <Route path="/dashboard" element={
            isAuthenticated ? <Dashboard user={user} transactions={transactions} updateBalance={updateBalance} /> : <Navigate to="/login" />} 
          />
          <Route path="/send-money" element={
            isAuthenticated ? <SendMoney user={user} updateBalance={updateBalance} triggerTransactionUpdate={triggerTransactionUpdate} /> : <Navigate to="/login" />} 
          />
          <Route path="/add-money" element={
            isAuthenticated ? <AddMoney user={user} updateBalance={updateBalance} triggerTransactionUpdate={triggerTransactionUpdate} /> : <Navigate to="/login" />} 
          />
          <Route path="/transactions" element={
            isAuthenticated ? <TransactionHistory user={user} transactions={transactions} triggerTransactionUpdate={triggerTransactionUpdate} /> : <Navigate to="/login" />} 
          />
          <Route path="/bill-payments" element={
            isAuthenticated ? <BillPayments user={user} triggerTransactionUpdate={triggerTransactionUpdate} /> : <Navigate to="/login" />} 
          />
          <Route path="/profile" element={
            isAuthenticated ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" />} 
          />
          <Route path="/notifications" element={
            isAuthenticated ? <Notifications user={user} /> : <Navigate to="/login" />} 
          />
          <Route path="/qr-generator" element={
            isAuthenticated ? <QRGenerator user={user} /> : <Navigate to="/login" />} 
          />
          <Route path="/qr-scanner" element={
            isAuthenticated ? <QRScanner user={user} /> : <Navigate to="/login" />} 
          />
          <Route path="/offers" element={
            isAuthenticated ? <OfferCashback user={user} /> : <Navigate to="/login" />} 
          />
          <Route path="/bank-transfer" element={
            isAuthenticated ? <BankTransfer user={user} triggerTransactionUpdate={triggerTransactionUpdate} /> : <Navigate to="/login" />} 
          />
          <Route path="/create-account" element={
            isAuthenticated ? <BankAccountCreation user={user} /> : <Navigate to="/login" />} 
          />
          <Route path="/admin" element={
            isAuthenticated && user?.role === 'admin' ? <AdminPanel user={user} /> : <Navigate to="/dashboard" />} 
          />
          <Route path="/split-money" element={
  isAuthenticated ? <SplitMoney user={user} /> : <Navigate to="/login" />
} />
          <Route path="/" element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;