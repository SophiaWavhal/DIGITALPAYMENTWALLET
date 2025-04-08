import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/BankTransfer.css';

const BankTransfer = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [balanceAccount, setBalanceAccount] = useState('');
  const [checkedBalance, setCheckedBalance] = useState(null);
  const [formData, setFormData] = useState({
    fromAccount: '',
    toAccount: '',
    recipientName: '',
    amount: '',
    ifscCode: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch accounts on component mount
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/user/accounts', {
          withCredentials: true
        });
        if (response.data.success) {
          setAccounts(response.data.accounts);
          if (response.data.accounts.length > 0) {
            const firstAccount = response.data.accounts[0].accountNumber;
            setFormData(prev => ({
              ...prev,
              fromAccount: firstAccount
            }));
            setBalanceAccount(firstAccount);
            setCheckedBalance(response.data.accounts[0].balance);
          }
        }
      } catch (err) {
        setError('Failed to load accounts.');
      }
    };
    fetchAccounts();
  }, []);

  // Update checked balance when account selection changes
  useEffect(() => {
    if (balanceAccount && accounts.length > 0) {
      const selected = accounts.find(acc => acc.accountNumber === balanceAccount);
      if (selected) {
        setCheckedBalance(selected.balance);
      }
    }
  }, [balanceAccount, accounts]);

  // Handle form input changes
  const handleTransferChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/transactions/bank-transfer',
        {
          fromAccount: formData.fromAccount,
          toAccount: formData.toAccount,
          recipientName: formData.recipientName,
          amount: parseFloat(formData.amount),
          ifscCode: formData.ifscCode
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setSuccess(`Transfer complete! New balance: ₹${response.data.newBalance.toFixed(2)}`);
        
        // Refresh accounts data
        const refreshResponse = await axios.get('http://localhost:5000/api/user/accounts', {
          withCredentials: true
        });
        setAccounts(refreshResponse.data.accounts);
        
        // Update checked balance if viewing the same account
        if (formData.fromAccount === balanceAccount) {
          const updatedAccount = refreshResponse.data.accounts.find(
            acc => acc.accountNumber === balanceAccount
          );
          setCheckedBalance(updatedAccount.balance);
        }

        window.dispatchEvent(new Event('transactionUpdated'));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Transfer failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bank-transfer-container">
      <h2>Bank Services</h2>

      {/* Balance Check Section */}
      <div className="balance-check-section">
        <h3>🔍 Check Account Balance</h3>
        <div className="form-group">
          <label>Select Account</label>
          <select
            value={balanceAccount}
            onChange={(e) => setBalanceAccount(e.target.value)}
            required
          >
            {accounts.map((acc) => (
              <option key={acc._id} value={acc.accountNumber}>
                {acc.accountNumber} ({acc.accountType})
              </option>
            ))}
          </select>
        </div>

        {checkedBalance !== null && (
          <div className="account-balance-highlight">
            <strong>Current Balance:</strong> ₹{checkedBalance.toFixed(2)}
          </div>
        )}
      </div>

      {/* Transfer Section */}
      <div className="transfer-section">
        <h3>💸 Transfer Money</h3>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleTransferSubmit}>
          <div className="form-group">
            <label>From Account</label>
            <select
              name="fromAccount"
              value={formData.fromAccount}
              onChange={(e) => {
                handleTransferChange(e);
                setBalanceAccount(e.target.value);
              }}
              required
            >
              {accounts.map(account => (
                <option key={account._id} value={account.accountNumber}>
                  {account.accountNumber} ({account.accountType}) - ₹{account.balance.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>To Account</label>
            <input
              type="text"
              name="toAccount"
              placeholder="Enter recipient account number"
              value={formData.toAccount}
              onChange={handleTransferChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Recipient Name</label>
            <input
              type="text"
              name="recipientName"
              placeholder="Recipient's name"
              value={formData.recipientName}
              onChange={handleTransferChange}
              required
            />
          </div>

          <div className="form-group">
            <label>IFSC Code</label>
            <input
              type="text"
              name="ifscCode"
              placeholder="Enter IFSC"
              value={formData.ifscCode}
              onChange={handleTransferChange}
              required
              pattern="^[A-Za-z]{4}0[A-Za-z0-9]{6}$"
            />
          </div>

          <div className="form-group">
            <label>Amount (₹)</label>
            <input
              type="number"
              name="amount"
              placeholder="Enter amount"
              value={formData.amount}
              onChange={handleTransferChange}
              min="1"
              step="0.01"
              required
            />
          </div>

          <button type="submit" className="transfer-button" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Transfer'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BankTransfer;