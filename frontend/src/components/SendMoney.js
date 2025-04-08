import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/SendMoney.css';

const SendMoney = ({ user, updateBalance, triggerTransactionUpdate }) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [bankAccounts, setBankAccounts] = useState([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState('');

  // Fetch user's bank accounts
  useEffect(() => {
    const fetchBankAccounts = async () => {
      if (user) {
        try {
          const response = await axios.get('/api/user/accounts', {
            withCredentials: true
          });
          
          console.log('Bank accounts response:', response.data); 
          
          if (response.data && response.data.accounts) {
            setBankAccounts(response.data.accounts);
            if (response.data.accounts.length > 0) {
              setSelectedBankAccount(response.data.accounts[0].accountNumber);
            }
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

    console.log('Submitting with:', {
      recipientEmail,
      amount,
      description,
      paymentMethod,
      selectedBankAccount
    });

    try {
      const payload = {
        recipientEmail,
        amount: parseFloat(amount),
        description,
        paymentMethod,
      };

      
      if (paymentMethod === 'bank') {
        if (!selectedBankAccount) {
          throw new Error('Please select a bank account');
        }
        payload.fromAccount = selectedBankAccount;
      }

      const response = await axios.post('/api/transactions/send', payload, {
        withCredentials: true
      });

      if (response.data.success) {
        setSuccess(`Successfully sent Rs${amount} to ${recipientEmail}`);
        
        // Update balance if payment was from wallet
        if (paymentMethod === 'wallet' && response.data.newBalance) {
          updateBalance(response.data.newBalance);
        }
        
        // Reset form
        setRecipientEmail('');
        setAmount('');
        setDescription('');
        
        // Refresh transactions
        triggerTransactionUpdate();
        window.dispatchEvent(new Event('transactionUpdated'));
      } else {
        throw new Error(response.data.message || 'Transaction failed');
      }
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err.response?.data?.message || err.message || 'Transaction failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate if form is valid
  const isFormValid = () => {
    const basicValid = amount && recipientEmail;
    
    if (paymentMethod === 'bank') {
      return basicValid && selectedBankAccount;
    }
    
    return basicValid;
  };

  return (
    <div className="send-money-container">
      <h2>Send Money</h2>
      
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

      <form onSubmit={handleSubmit} className="send-money-form">
        <div className="form-group">
          <label>Recipient Email</label>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="Enter recipient's email"
            required
          />
        </div>

        <div className="form-group">
          <label>Amount </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0.01"
            step="0.01"
            placeholder="Enter amount"
            required
          />
        </div>

        <div className="form-group">
          <label>Description (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a note"
          />
        </div>

        <div className="form-group payment-method-group">
          <label>Payment Method</label>
          <div className="payment-method-options">
            <label className={paymentMethod === 'wallet' ? 'active' : ''}>
              <input
                type="radio"
                name="paymentMethod"
                value="wallet"
                checked={paymentMethod === 'wallet'}
                onChange={() => {
                  console.log('Wallet selected');
                  setPaymentMethod('wallet');
                }}
              />
              From Wallet
            </label>
            
            <label className={paymentMethod === 'bank' ? 'active' : ''}>
              <input
                type="radio"
                name="paymentMethod"
                value="bank"
                checked={paymentMethod === 'bank'}
                onChange={() => {
                  console.log('Bank selected');
                  setPaymentMethod('bank');
                }}
                disabled={bankAccounts.length === 0}
              />
              From Bank Account
              {bankAccounts.length === 0 && (
                <span className="no-accounts-tooltip"> (No accounts available)</span>
              )}
            </label>
          </div>

          {paymentMethod === 'bank' && bankAccounts.length > 0 && (
            <div className="bank-account-selector">
              <label>Select Bank Account</label>
              <select
                value={selectedBankAccount}
                onChange={(e) => {
                  console.log('Selected account:', e.target.value);
                  setSelectedBankAccount(e.target.value);
                }}
                required
              >
                {bankAccounts.map((account) => (
                  <option 
                    key={account.accountNumber} 
                    value={account.accountNumber}
                  >
                    {account.bankName || 'Bank'} - {account.accountType} (****{account.accountNumber.slice(-4)})
                    Balance: ₹{account.balance.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isProcessing || !isFormValid()}
          className={isProcessing ? 'processing' : ''}
        >
          {isProcessing ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Processing...
            </>
          ) : (
            'Send Money'
          )}
        </button>
      </form>
    </div>
  );
};

export default SendMoney;