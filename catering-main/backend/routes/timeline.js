const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Event = require('../models/Event');
const { validateEvent } = require('../middleware/validation');
const { upload, uploadToCloudinary } = require('../utils/imageUpload');

// @route   GET /api/timeline
// @desc    Get all events for caterer
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { view = 'week', date } = req.query;
    const catererID = req.caterer.catererID;
    
    let dateFilter = {};
    const targetDate = date ? new Date(date) : new Date();
    
    // Date filtering based on view
    if (view === 'day') {
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      dateFilter = {
        eventDate: { $gte: startOfDay, $lte: endOfDay }
      };
    } else if (view === 'week') {
      const startOfWeek = new Date(targetDate);
      startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      dateFilter = {
        eventDate: { $gte: startOfWeek, $lte: endOfWeek }
      };
    } else if (view === 'month') {
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);
      
      dateFilter = {
        eventDate: { $gte: startOfMonth, $lte: endOfMonth }
      };
    }
    
    const events = await Event.find({
      catererID,
      isActive: true,
      ...dateFilter
    }).sort({ eventDate: 1, eventTime: 1 });
    
    res.json({
      success: true,
      events,
      view,
      date: targetDate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching timeline events',
      error: error.message
    });
  }
});

// @route   POST /api/timeline
// @desc    Create new event
// @access  Private
router.post('/', authMiddleware, upload.single('image'), validateEvent, async (req, res) => {
  try {
    const catererID = req.caterer.catererID;
    let imageUrl;
    if (req.file) {
      // Upload to Cloudinary and get the URL
      const cloudinaryResult = await uploadToCloudinary(req.file.path, 'catering-app');
      imageUrl = cloudinaryResult.url;
    }
    // Parse/convert fields from req.body
    const eventData = {
      ...req.body,
      catererID,
      eventId: `EVT_${catererID}_${Date.now()}`,
      imageUrl: imageUrl || undefined,
      guestCount: parseInt(req.body.guestCount, 10) || 1,
      totalAmount: parseFloat(req.body.totalAmount) || 0,
      isActive: req.body.isActive === 'false' ? false : true,
      selectedItems: Array.isArray(req.body.selectedItems)
        ? req.body.selectedItems
        : []
    };
    const newEvent = new Event(eventData);
    await newEvent.save();
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: newEvent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating event',
      error: error.message
    });
  }
});

// @route   PUT /api/timeline/:eventId
// @desc    Update event
// @access  Private
router.put('/:eventId', authMiddleware, validateEvent, async (req, res) => {
  try {
    const { eventId } = req.params;
    const catererID = req.caterer.catererID;
    
    const updatedEvent = await Event.findOneAndUpdate(
      { eventId, catererID },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating event',
      error: error.message
    });
  }
});

// @route   DELETE /api/timeline/:eventId
// @desc    Delete event (soft delete)
// @access  Private
router.delete('/:eventId', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const catererID = req.caterer.catererID;
    
    const deletedEvent = await Event.findOneAndUpdate(
      { eventId, catererID },
      { isActive: false },
      { new: true }
    );
    
    if (!deletedEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting event',
      error: error.message
    });
  }
});

// @route   GET /api/timeline/event/:catererID/:eventId
// @desc    Get a single event by catererID and eventId
// @access  Private
router.get('/event/:catererID/:eventId', authMiddleware, async (req, res) => {
  try {
    const { catererID, eventId } = req.params;
    console.log('Fetching event:', { catererID, eventId });
    const event = await Event.findOne({ catererID, eventId });
    if (!event) {
      console.log('Event not found for:', { catererID, eventId });
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    console.log('Event found:', event);
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching event', error: error.message });
  }
});

module.exports = router; 