const { body, validationResult } = require('express-validator');

// MenuItem validation
const validateMenuItem = [
  body('name').trim().isLength({ min: 1 }).escape(),
  body('price').isFloat({ min: 0 }),
  body('category').isIn(['starters', 'main', 'breads', 'drinks', 'desserts']),
  body('type').isIn(['veg', 'non-veg']),
  
  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Event validation
const validateEvent = [
  body('title').trim().isLength({ min: 1, max: 100 }).escape(),
  body('eventType').isIn(['Wedding', 'Corporate', 'Birthday', 'Anniversary', 'Other']),
  body('eventDate').isISO8601().toDate(),
  body('eventTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('venue').trim().isLength({ min: 1, max: 200 }).escape(),
  body('guestCount').isInt({ min: 1 }),
  body('customerEmail').isEmail().normalizeEmail(),
  body('customerPhone').isMobilePhone(),
  body('totalAmount').isFloat({ min: 0 }),
  body('status').optional().isIn(['Pending', 'Confirmed', 'Cancelled', 'Completed']),
  
  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = { validateMenuItem, validateEvent }; 