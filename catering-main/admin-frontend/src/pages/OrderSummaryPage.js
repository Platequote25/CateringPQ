import React, { useMemo } from 'react';

export default function OrderSummaryPage({ guestCount, items, goNext, goBack, dynamicPricing = [], misc = 0 }) {
  const { subtotal, highestItem, highestValue, highestPercent } = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let highestItem = null;
    let highestValue = 0;
    items.forEach(item => {
      const value = item.price * item.quantity;
      if (value > highestValue) {
        highestValue = value;
        highestItem = item;
      }
    });
    const highestPercent = subtotal > 0 ? (highestValue / subtotal) * 100 : 0;
    return { subtotal, highestItem, highestValue, highestPercent };
  }, [items]);

  // INR currency formatter
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  // Find applicable discount rule based on guestCount and min only
  let discountPercent = 0;
  if (Array.isArray(dynamicPricing) && dynamicPricing.length > 0 && guestCount) {
    // Find the rule with the highest min <= guestCount
    const applicableRule = dynamicPricing
      .filter(r => Number(r.min) <= Number(guestCount))
      .sort((a, b) => Number(b.min) - Number(a.min))[0];
    if (applicableRule) discountPercent = Number(applicableRule.discount) || 0;
  }
  const discount = subtotal * (discountPercent / 100);
  const total = subtotal + Number(misc) - discount;

  return (
    <div className="orderflow-container">
      <div className="orderflow-header-row">
        <button className="orderflow-back" onClick={goBack}>&larr;</button>
        <div className="orderflow-header">Order Summary</div>
        {guestCount && <div className="orderflow-guestcount">{guestCount}</div>}
      </div>
      <div className="orderflow-title">Review your order</div>
      <div className="orderflow-summary-list">
        {items.map((item, idx) => (
          <div className="orderflow-summary-item" key={idx}>
            <span>{item.name} x {item.quantity}</span>
            <span>{formatCurrency(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>
      {highestItem && (
        <div className="orderflow-summary-highlight">
          <strong>Top Item:</strong> {highestItem.name} ({formatCurrency(highestValue)}) — {highestPercent.toFixed(1)}% of subtotal
        </div>
      )}
      {/* Read-only Miscellaneous Cost */}
      <div className="orderflow-summary-misc">
        Miscellaneous Cost: <strong>{formatCurrency(misc)}</strong>
      </div>
      <div className="orderflow-summary-subtotal">Subtotal: <strong>{formatCurrency(subtotal)}</strong></div>
      {discountPercent > 0 && (
        <div className="orderflow-summary-discount" style={{ color: '#ff5c8d', fontWeight: 600 }}>
          Discount ({discountPercent}%): -{formatCurrency(discount)}
        </div>
      )}
      <div className="orderflow-summary-total">Total: {formatCurrency(total)}</div>
      <button className="orderflow-btn" onClick={goNext}>
        Confirm Order
      </button>
    </div>
  );
} 