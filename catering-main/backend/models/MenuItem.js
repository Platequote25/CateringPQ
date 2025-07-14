const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  catererID: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['veg', 'non-veg']
  },
  imageUrl: {
    type: String
  },
  imagePublicId: {
    type: String
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create compound index for faster queries
menuItemSchema.index({ catererID: 1, category: 1 });
menuItemSchema.index({ catererID: 1, type: 1 });
menuItemSchema.index({ catererID: 1, isAvailable: 1 });
menuItemSchema.index({ catererID: 1, isPopular: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema); 