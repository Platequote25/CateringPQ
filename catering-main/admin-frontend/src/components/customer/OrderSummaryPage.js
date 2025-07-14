import React, { useMemo } from 'react';

export default function OrderSummaryPage({ guestCount, items, goNext, goBack, dynamicPricing, misc, total, customerDetails }) {
  // Only include available items
  items = Array.isArray(items) ? items.filter(item => item.isAvailable === true) : [];

  // Calculate subtotal from items
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity) * Number(guestCount)), 0);
  misc = Number(misc) || 0;
  const totalBeforeDiscount = subtotal + misc;

  // Find applicable discount rule based on guestCount and min only
  let discountPercent = 0;
  if (Array.isArray(dynamicPricing) && dynamicPricing.length > 0 && guestCount) {
    // Find the rule with the highest min <= guestCount
    const applicableRule = dynamicPricing
      .filter(r => Number(r.min) <= Number(guestCount))
      .sort((a, b) => Number(b.min) - Number(a.min))[0];
    if (applicableRule) discountPercent = Number(applicableRule.discount) || 0;
  } else if (typeof dynamicPricing === 'number') {
    discountPercent = dynamicPricing;
  }
  const discountValue = totalBeforeDiscount * (discountPercent / 100);
  // Final total after discount
  const finalTotal = totalBeforeDiscount - discountValue;

  // INR currency formatter
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  // Find top item
  const { highestItem, highestValue, highestPercent } = useMemo(() => {
    let highestItem = null;
    let highestValue = 0;
    items.forEach(item => {
      const value = item.price * item.quantity *guestCount;
      if (value > highestValue) {
        highestValue = value;
        highestItem = item;
      }
    });
    const highestPercent = subtotal > 0 ? (highestValue / subtotal) * 100 : 0;
    return { highestItem, highestValue, highestPercent };
  }, [items, subtotal]);

  return (
    <div className="orderflow-container">
      <div className="orderflow-header-row">
        <button className="orderflow-back" onClick={goBack}>&larr;</button>
        <div className="orderflow-header">Order Summary</div>
        {guestCount && <div className="orderflow-guestcount">{guestCount}</div>}
      </div>
      <div className="orderflow-title">Review your order</div>
      {customerDetails && (
        <div className="orderflow-customer-details" style={{marginBottom: '16px', background: '#f8f8f8', padding: '12px', borderRadius: '8px'}}>
          <div><strong>Name:</strong> {customerDetails.name}</div>
          <div><strong>Phone:</strong> {customerDetails.phone}</div>
          <div><strong>Email:</strong> {customerDetails.email}</div>
          <div><strong>Event Name:</strong> {customerDetails.eventName}</div>
          <div><strong>Date:</strong> {customerDetails.eventDate}</div>
          <div><strong>Time:</strong> {customerDetails.eventTime}</div>
        </div>
      )}
      <div className="orderflow-summary-list">
        {items.map((item, idx) => (
          <div className="orderflow-summary-item" key={idx}>
            <span>{item.name} x {item.quantity *guestCount}</span>
            <span>{formatCurrency(item.price * item.quantity *guestCount)}</span>
          </div>
        ))}
      </div>
      {highestItem && (
        <div className="orderflow-summary-highlight">
          <strong>Top Item:</strong> {highestItem.name} ({formatCurrency(highestValue)}) — {highestPercent.toFixed(1)}% of subtotal
        </div>
      )}
      <div className="orderflow-summary-subtotal">Subtotal: <strong>{formatCurrency(subtotal)}</strong></div>
      <div className="orderflow-summary-misc" style={{ textAlign: 'left' }}>Miscellaneous Cost: <strong>{formatCurrency(misc)}</strong></div>
      <div className="orderflow-summary-total-intermediate" style={{ fontWeight: 700, fontSize: '1.15em', margin: '8px 0' }}>
        Total (Subtotal + Misc): <strong>{formatCurrency(totalBeforeDiscount)}</strong>
      </div>
      <div className="orderflow-summary-discount" style={{ color: '#ff5c8d', fontWeight: 600 }}>
        Discount ({discountPercent}%): -{formatCurrency(discountValue)}
      </div>
      <div className="orderflow-summary-total">Total: {formatCurrency(finalTotal)}</div>
      <button className="orderflow-btn" onClick={goNext}>
        Confirm Order
      </button>
    </div>
  );
} 