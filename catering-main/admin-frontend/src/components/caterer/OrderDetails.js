import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCatererProfile } from '../../redux/slices/catererSlice';

const OrderDetails = () => {
  const [order, setOrder] = useState(null);
  const { id } = useParams();
  const { catererID: catererIDFromUrl } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const catererInfo = useSelector(state => state.caterer.catererInfo);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const response = await axios.get(`/api/caterer/orders/${id}`, config);
        setOrder(response.data);
      } catch (error) {
      }
    };
    
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);


  useEffect(() => {
    if (catererIDFromUrl) {
      dispatch(fetchCatererProfile());
    }
  }, [catererIDFromUrl, dispatch]);

  if (!order) {
    return <div className="p-4">Loading...</div>;
  }
  console.log('Order object:', order);
  console.log('Order.pricing:', order.pricing);

  // Prepare selected items for table (similar to EventDetails.js)
  let selectedItems = order.items || [];

  // Use stored values from order.pricing
  const subtotal = Number(order.pricing?.subtotal) || 0;
  const misc = Number(order.pricing?.miscCost ?? catererInfo?.miscCost) || 0;
  const discount = Number(order.pricing?.discount) || 0;
  const total = Number(order.pricing?.total) || 0;

  // INR currency formatter
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  };

  return (
    <div className="add-event-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f8f8' }}>
      <div className="add-event-card">
        <button
          type="button"
          className="add-event-close"
          onClick={() => navigate('/caterer/orders')}
          aria-label="Back to Orders"
        >
          <span className="material-icons">close</span>
        </button>
        <h2 className="add-event-title">Order Details</h2>
        {order.event?.imageUrl && (
          <img src={order.event.imageUrl} alt={order.event.title} style={{ maxWidth: '320px', margin: '0 auto 24px', display: 'block', borderRadius: '12px', border: '1px solid #eee' }} />
        )}
        <div className="event-info">
          <p><b>Order Number:</b> {order.orderNumber}</p>
          <p><b>Event Name:</b> {order.event?.eventName || '-'}</p>
          <p><b>Event Type:</b> {order.event?.type || order.event?.eventType}</p>
          <p><b>Date:</b> {order.event?.date ? new Date(order.event.date).toLocaleDateString() : ''}</p>
          <p><b>Time:</b> {order.event?.time || order.event?.eventTime}</p>
          <p><b>Venue:</b> {order.event?.venue}</p>
          <p><b>Guests:</b> {order.event?.guestCount}</p>
          <p><b>Status:</b> {order.status}</p>
          <p><b>Customer Name:</b> {order.customer?.name}</p>
          <p><b>Email:</b> {order.customer?.email}</p>
          <p><b>Phone:</b> {order.customer?.phone}</p>
          <p><b>Total Amount:</b> {subtotal + misc}</p>
          <div style={{ margin: '12px 0 0 0', padding: '8px 0', borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
            <div><b>Subtotal:</b> {formatCurrency(subtotal)}</div>
            <div><b>Miscellaneous Cost:</b> {formatCurrency(misc)}</div>
            {discount > 0 && (
              <div style={{ color: '#ff5c8d', fontWeight: 600 }}>
                Discount: -{formatCurrency(discount)}
              </div>
            )}
            <div style={{ fontWeight: 700, fontSize: '1.13em', marginTop: 4 }}>
              Final Total: {formatCurrency(total)}
            </div>
          </div>
          <p><b>Created:</b> {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</p>
          <p><b>Updated:</b> {order.updatedAt ? new Date(order.updatedAt).toLocaleString() : ''}</p>
          <div style={{ marginTop: 16 }}>
            <b>Selected Items:</b>
            {selectedItems.length > 0 ? (
              <table style={{ width: '100%', marginTop: 8, fontSize: 15 }}>
                <thead>
                  <tr style={{ background: '#f9f9f9' }}>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>Quantity</th>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ border: '1px solid #eee', padding: '4px 8px' }}>{item.name}</td>
                      <td style={{ border: '1px solid #eee', padding: '4px 8px' }}>{item.quantity}</td>
                      <td style={{ border: '1px solid #eee', padding: '4px 8px' }}>₹{item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <span style={{ marginLeft: 8, color: '#888' }}>None</span>
            )}
          </div>
          {order.specialRequests && (
            <div style={{ marginTop: 16 }}>
              <b>Special Requests:</b>
              <div style={{ background: '#f9f9f9', borderRadius: 8, padding: 12, marginTop: 4 }}>{order.specialRequests}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails; 