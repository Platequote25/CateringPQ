import React, { useState } from 'react';

export default function CustomerDetailsForm({ initialDetails = {}, onSubmit, goBack }) {
  const [details, setDetails] = useState({
    name: initialDetails.name || '',
    phone: initialDetails.phone || '',
    email: initialDetails.email || '',
    eventName: initialDetails.eventName || '',
    eventDate: initialDetails.eventDate || '',
    eventTime: initialDetails.eventTime || '',
  });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const newErrors = {};
    if (!details.name.trim()) newErrors.name = 'Name is required.';
    if (!details.phone.trim()) {
      newErrors.phone = 'Phone is required.';
    } else if (!/^\d{10}$/.test(details.phone.trim())) {
      newErrors.phone = 'Phone must be 10 digits.';
    }
    if (!details.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(details.email.trim())) {
      newErrors.email = 'Invalid email format.';
    }
    if (!details.eventName.trim()) newErrors.eventName = 'Event name is required.';
    if (!details.eventDate) newErrors.eventDate = 'Event date is required.';
    if (!details.eventTime) newErrors.eventTime = 'Event time is required.';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setError('');
    onSubmit(details);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fcfbf7' }}>
      <form onSubmit={handleSubmit} className="orderflow-container" style={{ maxWidth: 420, width: '100%', background: '#fcfbf7', borderRadius: 16, padding: 32, boxShadow: '0 4px 24px rgba(0,0,0,0.09)', position: 'relative', margin: 0 }}>
        {goBack && (
          <button type="button" onClick={goBack} className="unified-back-btn" style={{ position: 'absolute', left: 16, top: 16, margin: 0, zIndex: 2, paddingLeft: 24, paddingRight: 24, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1em', marginRight: 6 , }}>&larr;</span> Back
          </button>
        )}
        <h2 style={{ textAlign: 'center', marginBottom: 24, fontWeight: 800, color: '#222', letterSpacing: 1}}>Event & Customer Details</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <label style={{ fontWeight: 600, color: '#222' }}>
            Name*<br />
            <input name="name" value={details.name} onChange={handleChange} required placeholder="Enter your name" className="orderflow-input" style={{ background: '#f5f3ea', color: '#222', fontSize: 16 , width: '90%'}} />
            {errors.name && <div className="orderflow-error" style={{ marginTop: 2 }}>{errors.name}</div>}
          </label>
          <label style={{ fontWeight: 600, color: '#222' }}>
            Phone*<br />
            <input name="phone" value={details.phone} onChange={handleChange} required type="tel" placeholder="Enter your phone number" className="orderflow-input" style={{ background: '#f5f3ea', color: '#222', fontSize: 16, width: '90%' }} />
            {errors.phone && <div className="orderflow-error" style={{ marginTop: 2 }}>{errors.phone}</div>}
          </label>
          <label style={{ fontWeight: 600, color: '#222' }}>
            Email*<br />
            <input name="email" value={details.email} onChange={handleChange} required type="email" placeholder="Enter your email" className="orderflow-input" style={{ background: '#f5f3ea', color: '#222', fontSize: 16 ,width: '90%'}} />
            {errors.email && <div className="orderflow-error" style={{ marginTop: 2 }}>{errors.email}</div>}
          </label>
          <label style={{ fontWeight: 700, color: '#ff5c8d' }}>
            Event Name*<br />
            <input name="eventName" value={details.eventName} onChange={handleChange} required placeholder="e.g. Birthday Party" className="orderflow-input" style={{ background: '#f5f3ea', color: '#222', fontWeight: 700, fontSize: 17,width: '90%' }} />
            {errors.eventName && <div className="orderflow-error" style={{ marginTop: 2 }}>{errors.eventName}</div>}
          </label>
          <label style={{ fontWeight: 600, color: '#222' }}>
            Event Date*<br />
            <input name="eventDate" value={details.eventDate} onChange={handleChange} required type="date" className="orderflow-input" style={{ background: '#f5f3ea', color: '#222', fontSize: 16,width: '90%' }} />
            {errors.eventDate && <div className="orderflow-error" style={{ marginTop: 2 }}>{errors.eventDate}</div>}
          </label>
          <label style={{ fontWeight: 600, color: '#222' }}>
            Event Time*<br />
            <input name="eventTime" value={details.eventTime} onChange={handleChange} required type="time" className="orderflow-input" style={{ background: '#f5f3ea', color: '#222', fontSize: 16,width: '90%' }} />
            {errors.eventTime && <div className="orderflow-error" style={{ marginTop: 2 }}>{errors.eventTime}</div>}
          </label>
        </div>
        {error && <div className="orderflow-error">{error}</div>}
        <button type="submit" className="orderflow-btn" style={{ width: '100%', marginTop: 18 }}>
          Continue
        </button>
      </form>
    </div>
  );
} 