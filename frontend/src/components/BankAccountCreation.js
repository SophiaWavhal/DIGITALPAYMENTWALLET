import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/BankAccountCreation.css';

const bankList = [
  { name: 'State Bank of India', ifscPrefix: 'SBIN' },
  { name: 'HDFC Bank', ifscPrefix: 'HDFC' },
  { name: 'ICICI Bank', ifscPrefix: 'ICIC' },
  { name: 'Axis Bank', ifscPrefix: 'UTIB' },
  { name: 'Punjab National Bank', ifscPrefix: 'PUNB' },
  { name: 'Kotak Mahindra Bank', ifscPrefix: 'KKBK' },
];

const generateAccountNumber = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10-digit
};

const generateIFSC = (prefix) => {
  const branchCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}0${branchCode}`;
};

const BankAccountCreation = ({ user }) => {
  const [formData, setFormData] = useState({
    accountType: 'savings',
    initialDeposit: 1000,
    selectedBank: bankList[0].name,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.initialDeposit < 1000) {
      setError('Minimum initial deposit is ₹1000');
      return;
    }

    setIsSubmitting(true);

    const bank = bankList.find(b => b.name === formData.selectedBank);
    const generatedAccountNumber = generateAccountNumber();
    const generatedIFSC = generateIFSC(bank.ifscPrefix);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/user/add-account',
        {
          accountType: formData.accountType,
          balance: parseFloat(formData.initialDeposit),
          accountNumber: generatedAccountNumber,
          ifscCode: generatedIFSC,
          bankName: bank.name,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess({
          accountNumber: generatedAccountNumber,
          ifscCode: generatedIFSC,
          accountType: formData.accountType,
          balance: formData.initialDeposit,
        });
        window.dispatchEvent(new Event('accountsUpdated'));
      }
    } catch (err) {
      console.error('Account creation error:', err);
      setError(err.response?.data?.message || 'Account creation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="success-container">
        <div className="success-card">
          <h3>🎉 Account Created Successfully!</h3>
          <div className="account-details">
            <p><strong>Bank:</strong> {formData.selectedBank}</p>
            <p><strong>Account Number:</strong> {success.accountNumber}</p>
            <p><strong>IFSC Code:</strong> {success.ifscCode}</p>
            <p><strong>Account Type:</strong> {success.accountType}</p>
            <p><strong>Current Balance:</strong> ₹{parseFloat(success.balance).toFixed(2)}</p>
          </div>
          <div className="button-group">
            <button
              className="primary-button"
              onClick={() => navigate('/bank-transfer')}
            >
              Make a Transfer
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                setSuccess(null);
                setFormData({
                  accountType: 'savings',
                  initialDeposit: 1000,
                  selectedBank: bankList[0].name
                });
              }}
            >
              Create Another Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-creation-container">
      <div className="creation-card">
        <h2>Open a New Bank Account</h2>
        <p className="subtitle">Start with just ₹1000 minimum deposit</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Select Bank</label>
            <select
              value={formData.selectedBank}
              onChange={(e) => setFormData({ ...formData, selectedBank: e.target.value })}
              required
            >
              {bankList.map((bank, idx) => (
                <option key={idx} value={bank.name}>{bank.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Account Type</label>
            <select
              name="accountType"
              value={formData.accountType}
              onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
              required
            >
              <option value="savings">Savings Account</option>
              <option value="current">Current Account</option>
              <option value="salary">Salary Account</option>
            </select>
          </div>

          <div className="form-group">
            <label>Initial Deposit (₹)</label>
            <input
              type="number"
              name="initialDeposit"
              value={formData.initialDeposit}
              onChange={(e) => setFormData({ ...formData, initialDeposit: e.target.value })}
              min="1000"
              step="100"
              required
            />
            <small>Minimum deposit: ₹1000</small>
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span> Creating Account...
              </>
            ) : (
              'Open Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default BankAccountCreation;
