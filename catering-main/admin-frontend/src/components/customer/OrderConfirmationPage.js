import React from 'react';

export default function OrderConfirmationPage({ orderSummary, orderConfirmation, goBack, onStartNewOrder, dynamicPricing = [] }) {
  if (!orderSummary || !orderConfirmation) {
    return (
      <div className="orderflow-container">
        <div className="orderflow-title">Loading confirmation...</div>
        <button className="orderflow-btn" style={{background: '#eee', color: '#444', marginTop: '32px'}} onClick={goBack}>
          Back to Summary
        </button>
      </div>
    );
  }

  const { orderNumber } = orderConfirmation;
  const { total: origTotal, guestCount, items: origItems, misc, discount, customerDetails } = orderSummary;
  // Only include available items
  const items = Array.isArray(origItems) ? origItems.filter(item => item.isAvailable === true) : [];

  // Calculate subtotal, top item
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity * Number(guestCount)), 0);
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
  const totalBeforeDiscount = subtotal + (Number(misc) || 0);

  // Discount logic (match OrderSummaryPage)
  let discountPercent = 0;
  if (Array.isArray(dynamicPricing) && dynamicPricing.length > 0 && guestCount) {
    // Find the rule with the highest min <= guestCount
    const applicableRule = dynamicPricing
      .filter(r => Number(r.min) <= Number(guestCount))
      .sort((a, b) => Number(b.min) - Number(a.min))[0];
    if (applicableRule) discountPercent = Number(applicableRule.discount) || 0;
  } else if (typeof discount === 'number') {
    discountPercent = discount;
  }
  const discountValue = totalBeforeDiscount * (discountPercent / 100);
  const finalTotal = totalBeforeDiscount - discountValue;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount); // Prices are now entered in rupees, no conversion needed
  };

  return (
    <div className="orderflow-container">
      <div className="orderflow-header">Thank You!</div>
      <div className="orderflow-title">Your order has been placed.</div>
      <p style={{textAlign: 'center', margin: '8px 0 24px'}}>
        Your order number is <strong>{orderNumber}</strong>.
      </p>
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
      <div className="orderflow-summary-misc" style={{marginTop: '24px', textAlign: 'left'}}>Miscellaneous Cost: <strong>{formatCurrency(misc)}</strong></div>
      <div className="orderflow-summary-subtotal">Subtotal: <strong>{formatCurrency(subtotal)}</strong></div>
      <div className="orderflow-summary-total-intermediate" style={{ fontWeight: 700, fontSize: '1.15em', margin: '8px 0' }}>
        Total (Subtotal + Misc): <strong>{formatCurrency(totalBeforeDiscount)}</strong>
      </div>
      {discountValue > 0 && (
        <div className="orderflow-summary-discount" style={{ color: '#ff5c8d', fontWeight: 600 }}>
          Discount: -{discountPercent.toFixed(1)}% ({formatCurrency(discountValue)})
        </div>
      )}
      <div className="orderflow-summary-total">Total: {formatCurrency(finalTotal)}</div>

      <div style={{display: 'flex', gap: '16px', marginTop: '32px'}}>
        <button className="orderflow-btn" style={{background: '#eee', color: '#444', fontSize: '1.1rem', padding: '14px 28px'}} onClick={goBack}>
          Back to Summary
        </button>
        <button className="orderflow-btn" style={{fontSize: '1.1rem', padding: '14px 28px'}} onClick={onStartNewOrder}>
          Start New Order
        </button>
      </div>
    </div>
  );
} 