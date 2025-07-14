import React from 'react';
import './ItemGrid.css';

const ItemGrid = ({ items }) => (
  <div className="item-grid">
    {items.map(item => (
      <div key={item._id} className="item-card">
        {/* Card content here, keep existing content */}
        {item.imageUrl && (
          <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 12, marginBottom: 12 }} />
        )}
        <div className="font-bold text-gray-900 mb-1" style={{ textAlign: 'center' }}>{item.name}</div>
        <div className="text-sm text-gray-500 mb-1">{item.category}</div>
        <div className="text-teal-600 font-semibold">₹{item.price}</div>
      </div>
    ))}
  </div>
);

export default ItemGrid; 