import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/AddMoney.css';

const AddMoney = ({ user, updateBalance }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (paymentMethod === 'bank') {
      axios.get('/api/user/accounts', { withCredentials: true })
        .then(res => {
          if (res.data.success) {
            setBankAccounts(res.data.accounts);
            if (res.data.accounts.length > 0) {
              setSelectedBankAccount(res.data.accounts[0].accountNumber);
            }
          }
        })
        .catch(() => {
          setError('Failed to load bank accounts.');
        });
    }
  }, [paymentMethod]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsProcessing(true);

    try {
      const payload = {
        amount: parseFloat(amount),
        paymentMethod
      };

      if (paymentMethod === 'bank') {
        payload.fromBankAccount = selectedBankAccount;
      }

      const response = await axios.post('/api/wallet/topup', payload, {
        withCredentials: true
      });

      if (response.data.success) {
        setSuccess(`Successfully added ₹${amount} to your wallet!`);
        if (updateBalance) {
          updateBalance(response.data.newBalance);
        }
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        throw new Error(response.data.message || 'Failed to add money');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add money. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="add-money-container">
      <h2>Add Money to Wallet</h2>
      <p>Quickly add funds to your EasyPay account</p>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="add-money-form">
        <div className="form-group">
          <label>Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="1"
            step="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label>Payment Method</label>
          <div className="payment-methods">
            {['upi', 'card', 'netbanking', 'bank'].map((method) => (
              <label key={method} className={`method-option ${paymentMethod === method ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                />
                <div className="method-content">
                  <div className="method-icon">
                    {method === 'upi' && '📲'}
                    {method === 'card' && '💳'}
                    {method === 'netbanking' && '🏦'}
                    {method === 'bank' && '🏛️'}
                  </div>
                  <div className="method-name">
                    {method === 'bank' ? 'Bank Account' : method.charAt(0).toUpperCase() + method.slice(1)}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Bank account selection */}
        {paymentMethod === 'bank' && (
          <div className="form-group">
            <label>Select Bank Account</label>
            <select
              value={selectedBankAccount}
              onChange={(e) => setSelectedBankAccount(e.target.value)}
              required
            >
              {bankAccounts.map((acc) => (
                <option key={acc._id} value={acc.accountNumber}>
                  {acc.accountNumber} ({acc.accountType})
                </option>
              ))}
            </select>
          </div>
        )}

        <button 
          type="submit" 
          className="add-money-button"
          disabled={isProcessing || !amount}
        >
          {isProcessing ? 'Processing...' : `Add ₹${amount || '0'}`}
        </button>
      </form>
    </div>
  );
};

export default AddMoney;
