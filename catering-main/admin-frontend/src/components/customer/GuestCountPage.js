import React, { useState, useEffect } from 'react';
import cateringLogo from '../../assets/orderflow/Catering.png';
export default React.memo(function GuestCountPage({ guestCount, setGuestCount, goNext, catererInfo }) {
  const [localGuestCount, setLocalGuestCount] = useState(guestCount);
  const [error, setError] = useState('');

  // Keep local state in sync if parent changes (e.g., on back navigation)
  useEffect(() => {
    setLocalGuestCount(guestCount);
  }, [guestCount]);

  const handleNext = () => {
    if (!localGuestCount || isNaN(localGuestCount) || Number(localGuestCount) < 1) {
      setError('Please enter a valid number of guests.');
      return;
    }
    setError('');
    // Update the parent state ONLY when proceeding
    setGuestCount(localGuestCount);
    goNext();
  };

  return (
    <div className="orderflow-container">
      <div className="orderflow-header">Catering</div>
      <div className="orderflow-image"><img
          src={catererInfo?.businessLogo || cateringLogo}
          alt="Catering Logo"
        /></div>
      <div className="orderflow-title">How many guests?</div>
      <input
        className="orderflow-input"
        type="number"
        placeholder="Enter number of guests"
        value={localGuestCount}
        onChange={e => setLocalGuestCount(e.target.value)}
      />
      {error && <div className="orderflow-error">{error}</div>}
      <button className="orderflow-btn" onClick={handleNext}>Next</button>
    </div>
  );
}); 
