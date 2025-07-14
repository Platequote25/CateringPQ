const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const catererSchema = new mongoose.Schema({
  catererID: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    select: false  // Don't include in queries by default
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  businessPhone: {
    type: String,
    trim: true
  },
  businessEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  businessAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  businessDescription: {
    type: String,
    trim: true
  },
  businessLogo: {
    type: String  // URL to cloudinary image
  },
  heroImage: {
    type: String  // URL to cloudinary image
  },
  businessHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  specialties: [String],
  maxDailyBookings: {
    type: Number,
    default: 3
  },
  isActive: {
    type: Boolean,
    default: true
  },
  dynamicPricing: [
    {
      min: { type: Number, required: true },
      discount: { type: Number, required: true }
    }
  ],
  miscCost: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true  // Automatically adds createdAt, updatedAt
});

// Pre-save middleware for hashing
catererSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Hash the password with salt rounds 12
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
catererSchema.methods.comparePassword = async function(enteredPassword) {
  if (typeof enteredPassword !== 'string' || typeof this.password !== 'string') {
    console.error('comparePassword error: enteredPassword or stored password is undefined or not a string', enteredPassword, this.password);
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Caterer', catererSchema); 