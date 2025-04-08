import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/OffersCashback.css';

const OfferCashback = ({ user }) => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activatedOffers, setActivatedOffers] = useState([]);
  const [cashbackStats, setCashbackStats] = useState({
    totalEarned: 0,
    available: 0,
    activeOffers: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const offersResponse = await axios.get('/api/offers');
        let userActivated = [];

        if (user) {
          try {
            const activatedResponse = await axios.get('/api/user/offers');
            userActivated = activatedResponse.data?.activatedOffers || [];
          } catch (err) {
            console.log("Couldn't fetch user offers", err);
          }
        }

        setOffers(offersResponse.data?.offers || []);
        setActivatedOffers(userActivated);
        calculateCashbackStats(offersResponse.data?.offers || [], userActivated);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load offers.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const calculateCashbackStats = (allOffers, activated) => {
    const safeAllOffers = Array.isArray(allOffers) ? allOffers : [];
    const safeActivated = Array.isArray(activated) ? activated : [];

    const activeOffers = safeAllOffers.filter(offer =>
      offer?._id && safeActivated.includes(offer._id)
    );

    const totalEarned = activeOffers.reduce((sum, offer) => sum + (offer?.cashback || 0), 0);

    setCashbackStats({
      totalEarned,
      available: totalEarned * 0.8,
      activeOffers: safeActivated.length
    });
  };

  const activateOffer = async (offerId) => {
    try {
      if (!user) throw new Error('Please login to activate offers');
      if (!offerId) throw new Error('Invalid offer');

      await axios.post(`/api/offers/${offerId}/activate`);

      const updatedActivated = Array.isArray(activatedOffers)
        ? [...activatedOffers, offerId]
        : [offerId];

      setActivatedOffers(updatedActivated);
      calculateCashbackStats(offers, updatedActivated);

      const activatedOffer = Array.isArray(offers)
        ? offers.find(o => o?._id === offerId)
        : null;

      if (activatedOffer) {
        alert(`Offer activated! ${activatedOffer.cashback}% cashback will be applied`);
      }
    } catch (error) {
      alert(error.response?.data?.message || error.message || 'Failed to activate offer');
    }
  };

  const isOfferActivated = (offerId) =>
    Array.isArray(activatedOffers) && activatedOffers.includes(offerId);

  return (
    <div className="offers-container">
      <h2>Special Offers & Cashback</h2>
      <p className="subtitle">Activate offers to get cashback on your transactions</p>

      {loading ? (
        <div className="loading-spinner">Loading offers...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : !Array.isArray(offers) || offers.length === 0 ? (
        <div className="no-offers">No offers available at the moment</div>
      ) : (
        <>
          <div className="offers-grid">
            {offers.map((offer) => (
              <div
                key={offer?._id || Math.random()}
                className={`offer-card ${isOfferActivated(offer?._id) ? 'activated' : ''}`}
              >
                <div className="offer-content">
                  <h3>{offer?.title || 'Special Offer'}</h3>
                  <p className="offer-description">{offer?.description || ''}</p>
                  <div className="offer-details">
                    <span className="cashback-badge">
                      {offer?.cashback || 0}% Cashback
                    </span>
                    <span className="validity">
                      Valid until: {offer?.validUntil
                        ? new Date(offer.validUntil).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  <button
                    onClick={() => offer?._id && activateOffer(offer._id)}
                    disabled={isOfferActivated(offer?._id) || !user}
                    className="activate-button"
                  >
                    {isOfferActivated(offer?._id) ? 'Activated' : 'Activate Offer'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cashback-summary">
            <h3>Your Cashback Summary</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">₹{cashbackStats.totalEarned.toFixed(2)}</div>
                <div className="stat-label">Total Earned</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">₹{cashbackStats.available.toFixed(2)}</div>
                <div className="stat-label">Available</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{cashbackStats.activeOffers}</div>
                <div className="stat-label">Active Offers</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OfferCashback;
