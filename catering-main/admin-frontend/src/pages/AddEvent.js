import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import '../App.css';
import { toast } from 'react-toastify';

const EVENT_TYPES = ['Wedding', 'Corporate', 'Birthday', 'Anniversary', 'Other'];

const AddEvent = () => {
  const navigate = useNavigate();
  const catererInfo = useSelector(state => state.caterer.catererInfo);
  const [form, setForm] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    type: '',
    venue: '',
    guestCount: '',
    image: null,
    customerEmail: '',
    customerPhone: '',
    totalAmount: '',
    status: 'Pending',
    notes: ''
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      setForm({ ...form, image: files[0] });
      if (files[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target.result);
        reader.readAsDataURL(files[0]);
      } else {
        setImagePreview(null);
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Combine date and time into a single ISO string
    const eventDateTime = new Date(form.date);
    if (form.time) {
      const [hours, minutes] = form.time.split(':');
      eventDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    }
    // Prepare event data (all required fields)
    const eventData = {
      title: form.name,
      description: form.description,
      eventDate: eventDateTime.toISOString(),
      eventTime: form.time,
      eventType: EVENT_TYPES.includes(form.type) ? form.type : 'Other',
      venue: form.venue,
      guestCount: parseInt(form.guestCount, 10),
      status: form.status,
      customerEmail: form.customerEmail,
      customerPhone: form.customerPhone,
      selectedItems: [],
      totalAmount: parseFloat(form.totalAmount),
      notes: form.description,
      isActive: true,
      catererID: catererInfo?._id || 'dummyCaterer',
    };
    // Use FormData to send the image and event data
    const formData = new FormData();
    Object.entries(eventData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    if (form.image) {
      formData.append('image', form.image);
    }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/timeline', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        toast.success('Event added successfully!');
        navigate('/caterer/timeline');
      } else {
        alert('Failed to add event: ' + data.message);
      }
    } catch (err) {
      setLoading(false);
      alert('Failed to add event.');
    }
  };

  return (
    <div className="add-event-bg">
      <form className="add-event-card" style={{ position: 'relative', overflow: 'hidden', maxWidth: 480, width: '100%', margin: '40px auto' }} onSubmit={handleSave}>
        <button type="button" className="add-event-close" onClick={() => navigate(-1)}>
          <span className="material-icons">close</span>
        </button>
        <div style={{paddingTop: 8, paddingBottom: 8}}>
          <h2 className="add-event-title">Add new event</h2>
          <label className="add-event-label">Name
            <input className="add-event-input" name="name" placeholder="Enter name" value={form.name} onChange={handleChange} required />
          </label>
          <label className="add-event-label">Description
            <textarea className="add-event-input" name="description" placeholder="Description" value={form.description} onChange={handleChange} rows={3} />
          </label>
          <div className="add-event-row">
            <label className="add-event-label" style={{flex:1}}>Date
              <input className="add-event-input" name="date" type="date" value={form.date} onChange={handleChange} required />
            </label>
            <label className="add-event-label" style={{flex:1}}>Time
              <input className="add-event-input" name="time" type="time" value={form.time} onChange={handleChange} required />
            </label>
          </div>
          <label className="add-event-label">Type
            <select className="add-event-input" name="type" value={form.type} onChange={handleChange} required>
              <option value="">Select type</option>
              {EVENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label className="add-event-label">Venue
            <input className="add-event-input" name="venue" placeholder="Venue" value={form.venue} onChange={handleChange} required />
          </label>
          <label className="add-event-label">Guest Count
            <input className="add-event-input" name="guestCount" type="number" min="1" placeholder="Number of guests" value={form.guestCount} onChange={handleChange} required />
          </label>
          <label className="add-event-label">Customer Email
            <input className="add-event-input" name="customerEmail" type="email" placeholder="Email" value={form.customerEmail} onChange={handleChange} required />
          </label>
          <label className="add-event-label">Customer Phone
            <input className="add-event-input" name="customerPhone" type="tel" placeholder="Phone" value={form.customerPhone} onChange={handleChange} required />
          </label>
          <label className="add-event-label">Total Amount
            <input className="add-event-input" name="totalAmount" type="number" min="0" step="0.01" placeholder="Total Amount" value={form.totalAmount} onChange={handleChange} required />
          </label>
          <label className="add-event-label">Status
            <select className="add-event-input" name="status" value={form.status} onChange={handleChange}>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Completed">Completed</option>
            </select>
          </label>
          <label className="add-event-label">Image
            <input className="add-event-input" name="image" type="file" accept="image/*" onChange={handleChange} />
            {imagePreview && <img src={imagePreview} alt="Preview" className="add-event-img-preview" />}
          </label>
        </div>
        <button className="add-event-save" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
      </form>
    </div>
  );
};

export default AddEvent; 