const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { upload } = require('../utils/imageUpload');
const {
  getMenuItems,
  createMenuItem,
  getMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemsByCategory
} = require('../controllers/menuController');
const categoryController = require('../controllers/categoryController');

// Category routes (must come before /:id routes)
router.get('/categories', authMiddleware, categoryController.getCategories);
router.post('/categories', authMiddleware, categoryController.addCategory);

// @route   GET /api/menu
// @desc    Get all menu items for a caterer
// @access  Private
router.get('/', authMiddleware, getMenuItems);

// @route   POST /api/menu
// @desc    Add a menu item
// @access  Private
router.post('/', authMiddleware, upload.single('image'), createMenuItem);

// @route   GET /api/menu/category/:category
// @desc    Get menu items by category
// @access  Private
router.get('/category/:category', authMiddleware, getMenuItemsByCategory);

// @route   GET /api/menu/:id
// @desc    Get a menu item by ID
// @access  Private
router.get('/:id', authMiddleware, getMenuItem);

// @route   PUT /api/menu/:id
// @desc    Update a menu item
// @access  Private
router.put('/:id', authMiddleware, upload.single('image'), updateMenuItem);

// @route   DELETE /api/menu/:id
// @desc    Delete a menu item
// @access  Private
router.delete('/:id', authMiddleware, deleteMenuItem);

// @route   POST /api/menu/test-upload
// @desc    Test image upload functionality
// @access  Private
router.post('/test-upload', authMiddleware, upload.single('image'), (req, res) => {
  try {
    console.log('Test upload endpoint called');
    console.log('File received:', req.file ? 'Yes' : 'No');
    
    if (req.file) {
      console.log('File details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });
      
      res.json({
        success: true,
        message: 'File uploaded successfully',
        file: {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
  } catch (error) {
    console.error('Test upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Test upload failed: ' + error.message
    });
  }
});

module.exports = router; 