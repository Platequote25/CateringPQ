const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Caterer = require('../models/Caterer');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Feedback = require('../models/Feedback');
const Contact = require('../models/Contact');

// @route   GET /api/customer/:catererID/info
// @desc    Get caterer information (public)
// @access  Public
router.get('/:catererID/info', async (req, res) => {
  try {
    const { catererID } = req.params;
    
    // Verify the caterer exists and is active
    const caterer = await Caterer.findOne({ catererID, isActive: true }).lean();
    
    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }
    
    // Return public caterer information
    res.json({
      success: true,
      caterer: {
        catererID: caterer.catererID,
        businessName: caterer.businessName,
        businessLogo: caterer.businessLogo,
        businessDescription: caterer.businessDescription,
        businessPhone: caterer.businessPhone,
        businessEmail: caterer.businessEmail,
        businessAddress: caterer.businessAddress,
        businessHours: caterer.businessHours,
        heroImage: caterer.heroImage,
        specialties: caterer.specialties,
        dynamicPricing: caterer.dynamicPricing || [],
        miscCost: caterer.miscCost || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/customer/:catererID/menu
// @desc    Get menu items for a specific caterer (public)
// @access  Public
router.get('/:catererID/menu', async (req, res) => {
  try {
    const { catererID } = req.params;
    
    // Verify the caterer exists and is active
    const caterer = await Caterer.findOne({ catererID, isActive: true }).lean();
    
    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }
    
    // Get all available menu items for this caterer
    const menuItems = await MenuItem.find({
      catererID,
      isAvailable: true
    }).lean();
    
    res.json({
      success: true,
      caterer: {
        businessName: caterer.businessName,
        logo: caterer.businessLogo,
        description: caterer.businessDescription
      },
      menu: menuItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/customer/:catererID/menu/popular
// @desc    Get popular menu items for a specific caterer (public)
// @access  Public
router.get('/:catererID/menu/popular', async (req, res) => {
  try {
    const { catererID } = req.params;
    const caterer = await Caterer.findOne({ catererID, isActive: true }).lean();
    if (!caterer) {
      return res.status(404).json({ success: false, message: 'Caterer not found' });
    }
    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 10;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;
    const menuItems = await MenuItem.find({
      catererID,
      isAvailable: true,
      isPopular: true
    }).skip(skip).limit(limit).lean();
    res.json({ success: true, menuItems, page, limit });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/customer/:catererID/menu/:category
// @desc    Get menu items by category for a specific caterer (public)
// @access  Public
router.get('/:catererID/menu/:category', async (req, res) => {
  try {
    const { catererID, category } = req.params;
    
    // Verify the caterer exists and is active
    const caterer = await Caterer.findOne({ catererID, isActive: true }).lean();
    
    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }
    
    // Get all available menu items for this caterer in the specified category
    const menuItems = await MenuItem.find({
      catererID,
      category,
      isAvailable: true
    }).lean();
    
    res.json({
      success: true,
      category,
      menu: menuItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/customer/:catererID/quote
// @desc    Calculate a quote based on menu selection
// @access  Public
router.post('/:catererID/quote', async (req, res) => {
  try {
    const { catererID } = req.params;
    const { selectedItems, guestCount } = req.body;
    
    if (!selectedItems || !Array.isArray(selectedItems) || selectedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Selected items are required'
      });
    }
    
    if (!guestCount || isNaN(guestCount) || guestCount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid guest count is required'
      });
    }
    
    // Verify the caterer exists and is active
    const caterer = await Caterer.findOne({ catererID, isActive: true }).lean();
    
    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }
    
    // Get details of the selected menu items
    const itemIds = selectedItems.map(item => item.itemId);
    const menuItems = await MenuItem.find({
      _id: { $in: itemIds },
      catererID,
      isAvailable: true
    }).lean();
    
    // Map menu items with quantities
    const itemsWithQuantity = menuItems.map(item => {
      const selectedItem = selectedItems.find(si => si.itemId === item._id.toString());
      return {
        _id: item._id,
        name: item.name,
        price: item.price,
        quantity: selectedItem ? selectedItem.quantity : 0
      };
    });
    
    // Calculate price
    let subtotal = 0;
    itemsWithQuantity.forEach(item => {
      subtotal += item.price * item.quantity * guestCount;
    });

    // Get miscCost from caterer
    const miscCost = Number(caterer.miscCost) || 0;

    // Calculate per plate cost
    const perPlateCost = (subtotal / guestCount).toFixed(2);

    // Apply discount based on dynamic pricing rules
    let discount = 0;
    if (Array.isArray(caterer.dynamicPricing) && caterer.dynamicPricing.length > 0) {
      // Find the rule with the highest min <= guestCount
      const applicableRule = caterer.dynamicPricing
        .filter(r => Number(r.min) <= Number(guestCount))
        .sort((a, b) => Number(b.min) - Number(a.min))[0];
      if (applicableRule) {
        discount = applicableRule.discount;
      }
    }

    // Apply discount to (subtotal + miscCost)
    const preDiscountTotal = subtotal + miscCost;
    const discountAmount = preDiscountTotal * (discount / 100);
    const totalCost = Math.max(0, preDiscountTotal - discountAmount); // Ensure total cost is never negative

    res.json({
      success: true,
      quote: {
        items: itemsWithQuantity,
        guestCount,
        subtotal,
        miscCost,
        discountPercent: discount * 100,
        discountAmount,
        perPlateCost,
        totalCost
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/customer/:catererID/booking
// @desc    Create a new booking/order
// @access  Public
router.post('/:catererID/booking', async (req, res) => {
  try {
    const { catererID } = req.params;
    const { 
      customerInfo,
      eventDetails,
      selectedItems,
      pricing,
      specialRequests
    } = req.body;
    
    // Validate required fields
    if (!customerInfo || !eventDetails || !selectedItems || !pricing) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking information'
      });
    }
    
    // Verify the caterer exists and is active
    const caterer = await Caterer.findOne({ catererID, isActive: true }).lean();
    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }
    
    // Create or find customer
    let customer = await Customer.findOne({ email: customerInfo.email }).lean();
    if (!customer) {
      customer = new Customer({
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        address: customerInfo.address
      });
      await customer.save();
    }
    
    // Get menu items to verify pricing
    const itemIds = selectedItems.map(item => new mongoose.Types.ObjectId(item.itemId));
    const menuItems = await MenuItem.find({
      _id: { $in: itemIds },
      catererID,
      isAvailable: true
    }).lean();
    
    // Log the received pricing object
    console.log('Received pricing:', pricing);
    
    // Map menu items with quantities and verify prices
    const orderItems = selectedItems.map(selectedItem => {
      const menuItem = menuItems.find(item => item._id.toString() === selectedItem.itemId);
      if (!menuItem) {
        console.warn(`Menu item not found (skipped): ${selectedItem.itemId}`);
        return null; // skip missing items
      }
      return {
        itemId: menuItem._id,
        name: menuItem.name,
        quantity: selectedItem.quantity,
        price: menuItem.price
      };
    }).filter(Boolean); // remove nulls
    
    // Use the quote ID as the order number if available
    const quoteId = req.body.quoteId || req.body.quoteID;
    
    // Generate a formatted order number if needed
    const generateOrderNumber = () => {
      const date = new Date();
      const year = date.getFullYear().toString().substr(-2);
      const month = ('0' + (date.getMonth() + 1)).slice(-2);
      const day = ('0' + date.getDate()).slice(-2);
      const random = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
      return `O${year}${month}${day}-${random}`;
    };
    
    // Create new order
    const order = new Order({
      orderNumber: quoteId || generateOrderNumber(), // Use quoteId if available
      customer: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone || '555-555-5555', // Default phone if not provided
        customerId: customer._id
      },
      caterer: caterer._id,
      catererID,
      event: {
        type: eventDetails.type || 'catering',
        eventName: eventDetails.eventName || '',
        date: new Date(eventDetails.date),
        time: eventDetails.time || '12:00',  // Default time if not provided
        location: eventDetails.location || 'To be determined', // Default location if not provided
        guestCount: eventDetails.guestCount
      },
      items: orderItems,
      pricing: {
        subtotal: pricing.subtotal,
        miscCost: pricing.miscCost || 0,
        discount: pricing.discount || 0,
        tax: pricing.tax || 0,
        total: (Number(pricing.subtotal) + Number(pricing.miscCost || 0)) - Number(pricing.discount || 0),
        deposit: pricing.deposit || 0,
        balance: ((Number(pricing.subtotal) + Number(pricing.miscCost || 0)) - Number(pricing.discount || 0)) - (pricing.deposit || 0)
      },
      specialRequests: specialRequests || '',
      status: 'pending',
      timeline: [{
        status: 'pending',
        timestamp: Date.now(),
        note: 'Order created'
      }]
    });
    
    await order.save();
    console.log('Order saved:', order);
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      orderId: order._id,
      orderNumber: order.orderNumber
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/customer/order/:orderNumber
// @desc    Get order details by order number
// @access  Public
router.get('/order/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const order = await Order.findOne({ orderNumber }).populate('caterer', 'businessName businessLogo businessPhone businessEmail').lean();
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/customer/:catererID/feedback
// @desc    Submit feedback for a specific caterer
// @access  Public
router.post('/:catererID/feedback', async (req, res) => {
  try {
    const { catererID } = req.params;
    const {
      customerInfo,
      ratings,
      comments,
      wouldRecommend,
      orderNumber
    } = req.body;
    
    // Find caterer
    const caterer = await Caterer.findOne({ catererID }).lean();
    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }
    
    // Find or create customer
    let customer = null;
    if (customerInfo.email) {
      customer = await Customer.findOne({ email: customerInfo.email }).lean();
      if (!customer) {
        customer = new Customer({
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone || '1234567890'
        });
        await customer.save();
      }
    }
    
    // Find the related order if order number is provided
    let order = null;
    if (orderNumber) {
      order = await Order.findOne({ orderNumber }).lean();
    }
    
    // Create feedback
    const feedback = new Feedback({
      order: order ? order._id : null,
      orderNumber,
      customer: {
        name: customerInfo.name,
        email: customerInfo.email,
        customerId: customer ? customer._id : null
      },
      caterer: caterer._id,
      catererID,
      ratings,
      comments: comments || '',
      message: comments || '',
      subject: 'Feedback on your catering service',
      wouldRecommend: wouldRecommend || false
    });
    
    await feedback.save();
    
    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId: feedback._id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/customer/:catererID/contact
// @desc    Submit a contact form to a caterer
// @access  Public
router.post('/:catererID/contact', async (req, res) => {
  try {
    const { catererID } = req.params;
    const { name, email, phone, message, subject } = req.body;
    
    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and message are required'
      });
    }
    
    // Find caterer
    const caterer = await Caterer.findOne({ catererID }).lean();
    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }
    
    // Store the contact message
    const contact = new Contact({
      caterer: caterer._id,
      catererID,
      name,
      email,
      phone,
      subject,
      message,
      isRead: false
    });
    
    await contact.save();
    
    // In a real application, you would also send an email to the caterer here
    
    res.json({
      success: true,
      message: 'Contact message sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/customer/:catererID/availability
// @desc    Check date availability for a caterer
// @access  Public
router.get('/:catererID/availability', async (req, res) => {
  try {
    const { catererID } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }
    
    // Verify the caterer exists and is active
    const caterer = await Caterer.findOne({ catererID, isActive: true }).lean();
    
    if (!caterer) {
      return res.status(404).json({
        success: false,
        message: 'Caterer not found'
      });
    }
    
    // Convert date string to Date object
    const requestedDate = new Date(date);
    
    // Check if the date is valid
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
    // Check if the date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (requestedDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Cannot check availability for past dates'
      });
    }
    
    // Check if there are any existing orders for this date
    const existingOrders = await Order.find({
      catererID,
      'event.date': {
        $gte: new Date(requestedDate.setHours(0, 0, 0, 0)),
        $lt: new Date(requestedDate.setHours(23, 59, 59, 999))
      }
    }).lean();
    
    // Check caterer's capacity (assuming caterer has a maxDailyBookings field)
    const maxDailyBookings = caterer.maxDailyBookings || 3; // Default to 3 if not specified
    const isAvailable = existingOrders.length < maxDailyBookings;
    
    res.json({
      success: true,
      availability: {
        date: date,
        isAvailable,
        existingBookings: existingOrders.length,
        maxBookings: maxDailyBookings,
        message: isAvailable 
          ? 'Date is available for booking' 
          : 'Date is fully booked, please select another date'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/customer/:catererID/booking/:bookingId
// @desc    Get booking details by ID or order number
// @access  Public
router.get('/:catererID/booking/:bookingId', async (req, res) => {
  try {
    const { catererID, bookingId } = req.params;
    
    console.log(`Looking for booking: ${bookingId} for caterer: ${catererID}`);
    
    // Try to find the order by orderNumber first, then by _id if that fails
    let order = await Order.findOne({
      orderNumber: bookingId,
      catererID
    }).populate('caterer', 'businessName businessLogo businessPhone businessEmail').lean();
    
    // If not found by orderNumber, try to find by _id
    if (!order) {
      try {
        if (mongoose.Types.ObjectId.isValid(bookingId)) {
          order = await Order.findOne({
            _id: bookingId,
            catererID
          }).populate('caterer', 'businessName businessLogo businessPhone businessEmail').lean();
        }
      } catch (idError) {
        console.log("Not a valid ObjectId, continuing with null order");
      }
    }
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.json({
      success: true,
      booking: {
        bookingId: order._id,
        orderNumber: order.orderNumber,
        customer: order.customer,
        event: order.event,
        items: order.items,
        pricing: order.pricing,
        status: order.status,
        specialRequests: order.specialRequests,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        caterer: {
          businessName: order.caterer.businessName,
          businessLogo: order.caterer.businessLogo,
          businessPhone: order.caterer.businessPhone,
          businessEmail: order.caterer.businessEmail
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 