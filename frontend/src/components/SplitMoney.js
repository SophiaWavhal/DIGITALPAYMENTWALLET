import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/SplitMoney.css';

const SplitMoney = () => {
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [description, setDescription] = useState('');
  const [participants, setParticipants] = useState([{ email: '', amount: '' }]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleParticipantChange = (index, field, value) => {
    const updated = [...participants];
    updated[index][field] = value;
    setParticipants(updated);
  };

  const addParticipant = () => {
    setParticipants([...participants, { email: '', amount: '' }]);
  };

  const removeParticipant = (index) => {
    if (participants.length > 1) {
      const updated = [...participants];
      updated.splice(index, 1);
      setParticipants(updated);
    }
  };

  const calculateEqualSplit = () => {
    if (!totalAmount || isNaN(totalAmount)) return;
    const amountPerPerson = (parseFloat(totalAmount) / participants.length).toFixed(2);
    setParticipants(participants.map(p => ({ ...p, amount: amountPerPerson })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (!title.trim()) throw new Error('Title is required');
      if (!totalAmount || isNaN(totalAmount) || parseFloat(totalAmount) <= 0) {
        throw new Error('Invalid total amount');
      }

      const sum = participants.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      if (Math.abs(sum - parseFloat(totalAmount)) > 0.01) {
        throw new Error('Amounts do not add up to total');
      }

      for (let p of participants) {
        if (!p.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
          throw new Error(`Invalid email: ${p.email}`);
        }
        if (!p.amount || isNaN(p.amount) || parseFloat(p.amount) <= 0) {
          throw new Error(`Invalid amount for ${p.email}`);
        }
      }

      const token = localStorage.getItem('token');
      if (!token) throw new Error('Unauthorized: No token found');

      const response = await axios.post('/api/split-money', {
        title,
        totalAmount: parseFloat(totalAmount),
        description,
        participants: participants.map(p => ({
          email: p.email,
          amount: parseFloat(p.amount)
        }))
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        alert('Money split successfully!');
        navigate('/dashboard');
      }

    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to split money');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="split-money-container">
      <h2>Split Money</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Dinner with friends"
            required
          />
        </div>

        <div className="form-group">
          <label>Total Amount (₹)</label>
          <input
            type="number"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            placeholder="1000"
            min="0.01"
            step="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label>Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Any additional details"
          />
        </div>

        <div className="participants-section">
          <div className="section-header">
            <h3>Participants</h3>
            <button type="button" onClick={calculateEqualSplit} className="btn-secondary">
              Split Equally
            </button>
          </div>

          {participants.map((p, index) => (
            <div key={index} className="participant-row">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={p.email}
                  onChange={(e) => handleParticipantChange(index, 'email', e.target.value)}
                  placeholder="friend@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  value={p.amount}
                  onChange={(e) => handleParticipantChange(index, 'amount', e.target.value)}
                  placeholder="500"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              {participants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeParticipant(index)}
                  className="remove-btn"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <button type="button" onClick={addParticipant} className="btn-secondary">
            + Add Participant
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? 'Processing...' : 'Split Money'}
        </button>
      </form>
    </div>
  );
};

export default SplitMoney;
