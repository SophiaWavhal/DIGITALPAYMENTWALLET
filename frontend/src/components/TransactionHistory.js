import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/TransactionHistory.css';
import NavMenu from './NavMenu';

const TransactionHistory = ({ user, transactions: initialTransactions }) => {
  const [transactions, setTransactions] = useState(initialTransactions || []);
  const [loading, setLoading] = useState(!initialTransactions);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        'http://localhost:5000/api/transactions/history',
        { withCredentials: true }
      );
      setTransactions(response.data.transactions);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialTransactions) {
      fetchTransactions();
    }
  }, [initialTransactions]);

  useEffect(() => {
    const handleUpdate = () => fetchTransactions();
    window.addEventListener('transactionUpdated', handleUpdate);
    return () => window.removeEventListener('transactionUpdated', handleUpdate);
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'credit') return tx.amount > 0;
    if (filter === 'debit') return tx.amount < 0;
    return true;
  });

  
  const getTransactionDetails = (transaction) => {
    const isCredit = transaction.amount > 0;
    let partyName = '';
    let label = '';
  
    if (isCredit) {
      label = 'From: ';
  
      if (transaction.sender?.name) {
        partyName = transaction.sender.name;
      } else if (transaction.senderEmail) {
        partyName = transaction.senderEmail;
      } else if (transaction.metadata?.senderName && transaction.metadata?.fromAccount) {
        partyName = `${transaction.metadata.senderName} (${transaction.metadata.fromAccount})`;
      } else if (transaction.metadata?.fromAccount) {
        partyName = `Account ${transaction.metadata.fromAccount}`;
      } else {
        partyName = 'System';
      }
  
    } else {
      label = 'To: ';
  
      if (transaction.recipient?.name) {
        partyName = transaction.recipient.name;
      } else if (transaction.recipientEmail) {
        partyName = transaction.recipientEmail;
      } else if (transaction.metadata?.recipientName && transaction.metadata?.toAccount) {
        partyName = `${transaction.metadata.recipientName} (${transaction.metadata.toAccount})`;
      } else if (transaction.metadata?.toAccount) {
        partyName = `Account ${transaction.metadata.toAccount}`;
      } else {
        partyName = 'System';
      }
    }
  
    return { label, partyName };
  };
  

  return (
    <div className="transaction-history-container">
      <NavMenu user={user} />
      
      <div className="history-content">
        <h2>Transaction History</h2>
        
        <div className="filter-options">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
            All
          </button>
          <button className={filter === 'credit' ? 'active' : ''} onClick={() => setFilter('credit')}>
            Received
          </button>
          <button className={filter === 'debit' ? 'active' : ''} onClick={() => setFilter('debit')}>
            Sent
          </button>
        </div>
        
        {loading ? (
          <div className="loading-spinner">Loading...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="no-transactions">No transactions found</div>
        ) : (
          <div className="transactions-list">
            {filteredTransactions.map((tx, index) => {
              const { label, partyName } = getTransactionDetails(tx);
              return (
                <div key={index} className={`transaction-item ${tx.amount > 0 ? 'credit' : 'debit'}`}>
                  <div className="transaction-info">
                    <p className="transaction-description">{tx.description}</p>
                    <p className="transaction-date">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                    <p className="transaction-party">
                      {label}{partyName}
                    </p>
                  </div>
                  <p className="transaction-amount">
                    {tx.amount > 0 ? '+' : '-'}₹{Math.abs(tx.amount).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;