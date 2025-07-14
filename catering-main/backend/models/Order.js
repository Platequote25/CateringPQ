const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
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
    phone: {
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
  event: {
    type: {
      type: String,
      required: true
    },
    eventName: {
      type: String,
      required: false
    },
    date: {
      type: Date,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    guestCount: {
      type: Number,
      required: true
    }
  },
  items: [
    {
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      price: {
        type: Number,
        required: true
      }
    }
  ],
  pricing: {
    subtotal: {
      type: Number,
      required: true
    },
    miscCost: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    },
    deposit: {
      type: Number,
      default: 0
    },
    balance: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'completed', 'cancelled'],
    default: 'pending'
  },
  specialRequests: {
    type: String
  },
  timeline: [
    {
      status: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      note: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unique order number before saving
OrderSchema.pre('save', async function(next) {
  try {
    if (this.isNew && !this.orderNumber) {
      try {
        // Get the highest order number in the format "O-XX" and increment it
        const highestOrder = await this.constructor.findOne({
          orderNumber: { $regex: /^O-\d+$/ }
        }).sort({ orderNumber: -1 });
        
        let nextNumber = 1;
        if (highestOrder && highestOrder.orderNumber) {
          const currentNumber = parseInt(highestOrder.orderNumber.split('-')[1]);
          if (!isNaN(currentNumber)) {
            nextNumber = currentNumber + 1;
          }
        }
    
        // Format: O-XX where XX is a sequential number
        this.orderNumber = `O-${nextNumber.toString().padStart(2, '0')}`;
      } catch (error) {
        console.error('Error generating sequential order number:', error);
        // Fallback to date-based ID if there's an error
        const date = new Date();
        const timestamp = date.getTime().toString().slice(-4);
        this.orderNumber = `O-${timestamp}`;
      }
    }
    
    // Add initial status to timeline if new order
    if (this.isNew && (!this.timeline || this.timeline.length === 0)) {
      this.timeline = [{
      status: this.status,
      timestamp: Date.now(),
      note: 'Order created'
      }];
  }
  
  this.updatedAt = Date.now();
  next();
  } catch (error) {
    console.error('Error in Order pre-save hook:', error);
    next(error);
  }
});

module.exports = mongoose.model('Order', OrderSchema); 