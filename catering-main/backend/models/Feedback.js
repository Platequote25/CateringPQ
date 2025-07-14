const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  orderNumber: {
    type: String
  },
  customer: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    }
  },
  caterer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Caterer',
    required: true
  },
  catererID: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    default: 'Feedback on your catering service'
  },
  ratings: {
    foodQuality: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    service: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    punctuality: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    overall: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    }
  },
  message: {
    type: String,
    default: ''
  },
  comments: {
    type: String,
    default: ''
  },
  wouldRecommend: {
    type: Boolean
  },
  images: [
    {
      type: String // URLs to uploaded images
    }
  ],
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for customerName
FeedbackSchema.virtual('customerName').get(function() {
  return this.customer.name;
});

// Virtual for customerEmail
FeedbackSchema.virtual('customerEmail').get(function() {
  return this.customer.email;
});

// Pre-save middleware to set readAt when marked as read
FeedbackSchema.pre('save', function(next) {
  if (this.isModified('read') && this.read && !this.readAt) {
    this.readAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Feedback', FeedbackSchema); 