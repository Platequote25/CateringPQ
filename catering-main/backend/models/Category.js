const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  catererID: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

categorySchema.index({ catererID: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema); 