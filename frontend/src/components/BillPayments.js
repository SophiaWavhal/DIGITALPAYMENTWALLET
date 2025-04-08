import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/BillPayments.css';

const BillPayments = ({ user, triggerTransactionUpdate }) => {
  const [activeCategory, setActiveCategory] = useState('electricity');
  const [formData, setFormData] = useState({
    provider: '',
    customerId: '',
    amount: '',
    paymentMethod: 'wallet',
    description: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState('');

  const billCategories = [
    { id: 'electricity', name: 'Electricity', icon: '💡' },
    { id: 'gas', name: 'Gas', icon: '🔥' },
    { id: 'water', name: 'Water', icon: '💧' },
    { id: 'internet', name: 'Internet', icon: '🌐' },
    { id: 'mobile', name: 'Mobile', icon: '📱' },
    { id: 'insurance', name: 'Insurance', icon: '🛡️' }
  ];

  useEffect(() => {
    const fetchBankAccounts = async () => {
      if (user) {
        try {
          const response = await axios.get('/api/user/accounts', {
            withCredentials: true
          });
          setBankAccounts(response.data.accounts || []);
          if (response.data.accounts?.length > 0) {
            setSelectedBankAccount(response.data.accounts[0].accountNumber);
          }
        } catch (err) {
          console.error("Error fetching bank accounts:", err);
          setError('Failed to load bank accounts');
        }
      }
    };
    fetchBankAccounts();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsProcessing(true);

    try {
      const { provider, customerId, amount, paymentMethod, description } = formData;

      if (!provider || !customerId || !amount) {
        throw new Error('Please fill all required fields');
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const payload = {
        category: activeCategory,
        provider,
        customerId,
        amount: amountNum,
        paymentMethod,
        description
      };

      if (paymentMethod === 'bank') {
        if (!selectedBankAccount) {
          throw new Error('Please select a bank account');
        }
        payload.fromAccount = selectedBankAccount;
      }

      const response = await axios.post('/api/bills/pay', payload, {
        withCredentials: true
      });

      if (response.data.success) {
        const accountSuffix =
          paymentMethod === 'bank'
            ? ` from A/C ****${selectedBankAccount.slice(-4)}`
            : paymentMethod === 'upi'
            ? ' via UPI'
            : ' from Wallet';

        setSuccess(
          `Payment of ₹${amountNum.toFixed(2)} to ${provider}${accountSuffix} was successful!`
        );

        setFormData({
          provider: '',
          customerId: '',
          amount: '',
          paymentMethod: 'wallet',
          description: ''
        });

        triggerTransactionUpdate();
        window.dispatchEvent(new Event('transactionUpdated'));
      } else {
        throw new Error(response.data.message || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bill-payments-container">
      <h2>Pay Bills</h2>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          <i className="fas fa-check-circle"></i> {success}
        </div>
      )}

      <div className="bill-categories">
        {billCategories.map((category) => (
          <div
            key={category.id}
            className={`category-card ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory(category.id);
              setFormData((prev) => ({ ...prev, provider: '' }));
            }}
          >
            <div className="category-icon">{category.icon}</div>
            <div className="category-name">{category.name}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bill-payment-form">
        <div className="form-group">
          <label>Provider</label>
          <input
            type="text"
            name="provider"
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
            placeholder={`Enter ${activeCategory} provider`}
            required
          />
        </div>

        <div className="form-group">
          <label>Customer ID</label>
          <input
            type="text"
            name="customerId"
            value={formData.customerId}
            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            placeholder="Enter your customer ID"
            required
          />
        </div>

        <div className="form-group">
          <label>Amount (₹)</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            min="0.01"
            step="0.01"
            placeholder="Enter amount"
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Add an optional note"
          />
        </div>

        <div className="form-group">
          <label>Payment Method</label>
          <div className="payment-methods">
            <label className={formData.paymentMethod === 'wallet' ? 'active' : ''}>
              <input
                type="radio"
                name="paymentMethod"
                value="wallet"
                checked={formData.paymentMethod === 'wallet'}
                onChange={() => setFormData({ ...formData, paymentMethod: 'wallet' })}
              />
              Wallet
            </label>

            <label className={formData.paymentMethod === 'bank' ? 'active' : ''}>
              <input
                type="radio"
                name="paymentMethod"
                value="bank"
                checked={formData.paymentMethod === 'bank'}
                onChange={() => setFormData({ ...formData, paymentMethod: 'bank' })}
                disabled={bankAccounts.length === 0}
              />
              Bank Account
              {bankAccounts.length === 0 && (
                <span className="no-accounts-tooltip"> (No accounts available)</span>
              )}
            </label>

            <label className={formData.paymentMethod === 'upi' ? 'active' : ''}>
              <input
                type="radio"
                name="paymentMethod"
                value="upi"
                checked={formData.paymentMethod === 'upi'}
                onChange={() => setFormData({ ...formData, paymentMethod: 'upi' })}
              />
              UPI
            </label>
          </div>

          {formData.paymentMethod === 'bank' && bankAccounts.length > 0 && (
            <div className="bank-account-selector">
              <select
                value={selectedBankAccount}
                onChange={(e) => setSelectedBankAccount(e.target.value)}
                required
              >
                {bankAccounts.map((account) => (
                  <option key={account.accountNumber} value={account.accountNumber}>
                    {account.accountType} - ****{account.accountNumber.slice(-4)} (₹
                    {account.balance.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={
            isProcessing ||
            !formData.provider ||
            !formData.customerId ||
            !formData.amount ||
            (formData.paymentMethod === 'bank' && !selectedBankAccount)
          }
          className={isProcessing ? 'processing' : ''}
        >
          {isProcessing ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Processing...
            </>
          ) : (
            'Pay Bill'
          )}
        </button>
      </form>
    </div>
  );
};

export default BillPayments;
