const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const Caterer = require('../models/Caterer');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Contact = require('../models/Contact');
const Feedback = require('../models/Feedback');
const jwt = require('jsonwebtoken');
const { upload, uploadToCloudinary } = require('../utils/imageUpload');

// @route   GET /api/caterer/profile
// @desc    Get caterer profile
// @access  Private
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const caterer = await Caterer.findOne({ catererID: req.caterer.catererID });

    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }

    res.json({
      success: true,
      data: caterer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/caterer/profile
// @desc    Update caterer profile
// @access  Private
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    // Don't allow updating catererID or password through this route
    const { catererID, password, ...updateData } = req.body;

    const caterer = await Caterer.findOneAndUpdate(
      { catererID: req.caterer.catererID },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }

    res.json({
      success: true,
      data: caterer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/caterer/change-key
// @desc    Change caterer password
// @access  Private
router.put('/change-key', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get caterer with password
    const caterer = await Caterer.findOne({ catererID: req.caterer.catererID }).select('+password');

    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }

    // Check if current password is correct
    const isMatch = await caterer.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update the password
    caterer.password = newPassword;
    await caterer.save();

    // Generate new token
    const payload = {
      catererID: caterer.catererID,
      businessName: caterer.businessName
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({
          success: true,
          message: 'Password updated successfully',
          token
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});
  
// @route   GET /api/caterer/contacts
// @desc    Get all contacts for the logged in caterer
// @access  Private
router.get('/contacts', authMiddleware, async (req, res) => {
  try {
    const caterer = await Caterer.findOne({ catererID: req.caterer.catererID });
    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }

    const contacts = await Contact.find({ catererID: caterer.catererID })
      .sort({ createdAt: -1 })
      .lean();
    res.json({
      success: true,
      contacts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/caterer/contacts/:id
// @desc    Get a specific contact by ID
// @access  Private
router.get('/contacts/:id', authMiddleware, async (req, res) => {
  try {
    const caterer = await Caterer.findOne({ catererID: req.caterer.catererID });
    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }

    const contact = await Contact.findOne({ 
      _id: req.params.id,
      catererID: caterer.catererID
    }).lean();
    console.log("contact", contact);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    // Mark as read if not already
    if (!contact.isRead) {
      contact.isRead = true;
      await contact.save();
    }

    res.json({
      success: true,
      contact
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/caterer/feedback
// @desc    Get all feedback for the logged in caterer
// @access  Private
router.get('/feedback', authMiddleware, async (req, res) => {
  try {
    const caterer = await Caterer.findOne({ catererID: req.caterer.catererID });
    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }

    const feedback = await Feedback.find({ catererID: caterer.catererID })
      .sort({ createdAt: -1 })
      .lean();
    console.log("feedback", feedback);
    

    // Calculate average ratings
    let totalFeedback = feedback.length;
    let ratingSum = {
      foodQuality: 0,
      service: 0,
      valueForMoney: 0,
      punctuality: 0,
      overall: 0
    };

    feedback.forEach(item => {
      if (item.ratings) {
        ratingSum.foodQuality += item.ratings.foodQuality || 0;
        ratingSum.service += item.ratings.service || 0;
        ratingSum.valueForMoney += item.ratings.valueForMoney || 0;
        ratingSum.punctuality += item.ratings.punctuality || 0;
        ratingSum.overall += item.ratings.overall || 0;
      }
    });

    const averageRatings = totalFeedback > 0 ? {
      foodQuality: (ratingSum.foodQuality / totalFeedback).toFixed(1),
      service: (ratingSum.service / totalFeedback).toFixed(1),
      valueForMoney: (ratingSum.valueForMoney / totalFeedback).toFixed(1),
      punctuality: (ratingSum.punctuality / totalFeedback).toFixed(1),
      overall: (ratingSum.overall / totalFeedback).toFixed(1)
    } : null;

    res.json({
      success: true,
      totalFeedback,
      averageRatings,
      feedback
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/caterer/orders
// @desc    Get all orders for the logged in caterer
// @access  Private
router.get('/orders', authMiddleware, async (req, res) => {
  try {
    const caterer = await Caterer.findOne({ catererID: req.caterer.catererID });
    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }

    // Pagination
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 20;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ catererID: caterer.catererID })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalOrders = await Order.countDocuments({ catererID: caterer.catererID });

    res.json({
      success: true,
      orders,
      page,
      limit,
      totalOrders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/caterer/orders/:id
// @desc    Get a single order by ID
// @access  Private
router.get('/orders/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id }).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/caterer/orders/:id/status
// @desc    Update order status
// @access  Private
router.put('/orders/:id/status', [
  authMiddleware,
  check('status', 'Status is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const caterer = await Caterer.findOne({ catererID: req.caterer.catererID });
    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }

    const { status, note } = req.body;

    const order = await Order.findOne({ 
      _id: req.params.id,
      catererID: caterer.catererID
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update status
    order.status = status;
    
    // Add to timeline
    order.timeline.push({
      status,
      timestamp: Date.now(),
      note: note || `Status updated to ${status}`
    });

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated',
      order
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/caterer/feedback/:id
// @desc    Get a specific feedback by ID
// @access  Private
router.get('/feedback/:id', authMiddleware, async (req, res) => {
  try {
    const caterer = await Caterer.findOne({ catererID: req.caterer.catererID });
    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }

    const feedback = await Feedback.findOne({ 
      _id: req.params.id,
      catererID: caterer.catererID
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Mark as read if not already
    if (!feedback.read) {
      feedback.read = true;
      await feedback.save();
    }

    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/caterer/feedback/:id/read
// @desc    Mark feedback as read
// @access  Private
router.put('/feedback/:id/read', authMiddleware, async (req, res) => {
  try {
    const caterer = await Caterer.findOne({ catererID: req.caterer.catererID });
    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }

    const feedback = await Feedback.findOne({ 
      _id: req.params.id,
      catererID: caterer.catererID
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    feedback.read = true;
    await feedback.save();

    res.json({
      success: true,
      message: 'Feedback marked as read',
      feedback
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/caterer/contacts/:id/resolve
// @desc    Mark contact as resolved
// @access  Private
router.put('/contacts/:id/resolve', authMiddleware, async (req, res) => {
  try {
    const caterer = await Caterer.findOne({ catererID: req.caterer.catererID });
    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }

    const contact = await Contact.findOne({ 
      _id: req.params.id,
      catererID: caterer.catererID
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    contact.resolved = true;
    contact.resolvedAt = Date.now();
    
    // Add notes if provided
    if (req.body.notes) {
      contact.notes = req.body.notes;
    }
    
    await contact.save();

    res.json({
      success: true,
      message: 'Contact marked as resolved',
      contact
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/caterer/dashboard
// @desc    Get dashboard statistics
// @access  Private
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const caterer = await Caterer.findOne({ catererID: req.caterer.catererID });
    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }

    // Get counts
    const totalOrders = await Order.countDocuments({ catererID: caterer.catererID });
    const pendingOrders = await Order.countDocuments({ 
      catererID: caterer.catererID,
      status: { $in: ['pending', 'confirmed', 'preparing'] }
    });
    const completedOrders = await Order.countDocuments({ 
      catererID: caterer.catererID,
      status: 'completed'
    });
    const cancelledOrders = await Order.countDocuments({ 
      catererID: caterer.catererID,
      status: 'cancelled'
    });
    
    const unreadFeedback = await Feedback.countDocuments({ 
      catererID: caterer.catererID,
      read: false
    });
    
    const unresolvedContacts = await Contact.countDocuments({ 
      catererID: caterer.catererID,
      resolved: false
    });
    
    // Get recent items
    const recentOrders = await Order.find({ catererID: caterer.catererID })
      .sort({ createdAt: -1 })
      .limit(5);
      
    const recentFeedback = await Feedback.find({ catererID: caterer.catererID })
      .sort({ createdAt: -1 })
      .limit(5);
      
    const recentContacts = await Contact.find({ catererID: caterer.catererID })
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Calculate revenue
    const allOrders = await Order.find({ 
      catererID: caterer.catererID,
      status: { $ne: 'cancelled' }
    });
    
    const totalRevenue = allOrders.reduce((sum, order) => sum + order.pricing.total, 0);
    
    // Get monthly revenue data for chart
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    
    const monthlyOrders = await Order.find({
      catererID: caterer.catererID,
      status: { $ne: 'cancelled' },
      createdAt: { $gte: sixMonthsAgo }
    });
    
    const monthlyRevenue = {};
    
    // Initialize the last 6 months
    for (let i = 0; i < 6; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${month.getFullYear()}-${month.getMonth() + 1}`;
      monthlyRevenue[monthKey] = 0;
    }
    
    // Fill in the revenue data
    monthlyOrders.forEach(order => {
      const date = new Date(order.createdAt);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      if (monthlyRevenue[monthKey] !== undefined) {
        monthlyRevenue[monthKey] += order.pricing.total;
      }
    });
    
    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        unreadFeedback,
        unresolvedContacts,
        totalRevenue
      },
      recentItems: {
        orders: recentOrders,
        feedback: recentFeedback,
        contacts: recentContacts
      },
      chartData: {
        monthlyRevenue
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/caterer/logo
// @desc    Upload and update business logo for caterer
// @access  Private
router.post('/logo', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    console.log('Received file:', req.file);
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'catering-app/caterer-logos');
    // Update caterer profile
    const caterer = await Caterer.findOneAndUpdate(
      { catererID: req.caterer.catererID },
      { $set: { businessLogo: result.url } },
      { new: true }
    );
    if (!caterer) {
      return res.status(404).json({ success: false, message: 'Caterer not found' });
    }
    res.json({ success: true, url: result.url });
  } catch (error) {
    console.error('Logo upload failed:', error);
    res.status(500).json({ success: false, message: 'Logo upload failed', error: error.message });
  }
});

module.exports = router; 
