const MenuItem = require('../models/MenuItem');
const { uploadToCloudinary, deleteFromCloudinary } = require('../utils/imageUpload');

// @desc    Get all menu items for a caterer
// @route   GET /api/menu
// @access  Private
exports.getMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ catererID: req.caterer.catererID });
    res.json({
      success: true,
      data: menuItems
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add a menu item
// @route   POST /api/menu
// @access  Private
exports.createMenuItem = async (req, res) => {
  console.log('--- createMenuItem called ---');
  try {
    console.log('Creating menu item with data:', req.body);
    console.log('File uploaded:', req.file ? 'Yes' : 'No');
    
    const menuItemData = {
      ...req.body,
      catererID: req.caterer.catererID
    };
    
    // Convert price to number
    if (menuItemData.price) {
      menuItemData.price = Number(menuItemData.price);
      // Ensure price is not negative
      if (menuItemData.price < 0) {
        return res.status(400).json({
          success: false,
          message: 'Price cannot be negative'
        });
      }
    }
    
    // Handle boolean fields
    if (menuItemData.isAvailable !== undefined) {
      menuItemData.isAvailable = menuItemData.isAvailable === 'true' || menuItemData.isAvailable === true;
    } else {
      menuItemData.isAvailable = true; // Default to true
    }
    
    if (menuItemData.isPopular !== undefined) {
      menuItemData.isPopular = menuItemData.isPopular === 'true' || menuItemData.isPopular === true;
    } else {
      menuItemData.isPopular = false; // Default to false
    }
    
    // If image was uploaded
    if (req.file) {
      console.log('Processing image upload (buffer):', req.file.originalname);
      try {
        const result = await uploadToCloudinary(req.file.buffer, 'catering-app/menu-items');
        console.log('Image uploaded successfully:', result.url);
        menuItemData.imageUrl = result.url;
        menuItemData.imagePublicId = result.public_id;
      } catch (imageError) {
        console.error('Image upload failed:', imageError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image: ' + imageError.message
        });
      }
    }
    
    // Validate menu item data
    if (!menuItemData.name || !menuItemData.price || !menuItemData.category || !menuItemData.type) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    console.log('Saving menu item with data:', menuItemData);
    const newMenuItem = new MenuItem(menuItemData);
    const menuItem = await newMenuItem.save();
    
    console.log('Menu item saved successfully:', menuItem._id);
    
    res.status(201).json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

// @desc    Get a menu item by ID
// @route   GET /api/menu/:id
// @access  Private
exports.getMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findOne({ 
      _id: req.params.id, 
      catererID: req.caterer.catererID 
    });
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }
    
    res.json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update a menu item
// @route   PUT /api/menu/:id
// @access  Private
exports.updateMenuItem = async (req, res) => {
  try {
    // Check if item exists and belongs to this caterer
    let menuItem = await MenuItem.findOne({ 
      _id: req.params.id, 
      catererID: req.caterer.catererID 
    });
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }
    
    const menuItemData = { ...req.body };
    
    // Debug: log isAvailable before conversion
    console.log('isAvailable received:', menuItemData.isAvailable, 'type:', typeof menuItemData.isAvailable);

    // Convert isAvailable to boolean if present
    if (menuItemData.isAvailable !== undefined) {
      menuItemData.isAvailable = menuItemData.isAvailable === 'true' || menuItemData.isAvailable === true;
      // Debug: log isAvailable after conversion
      console.log('isAvailable after conversion:', menuItemData.isAvailable, 'type:', typeof menuItemData.isAvailable);
    }
    
    // Convert price to number if provided
    if (menuItemData.price) {
      menuItemData.price = Number(menuItemData.price);
      // Ensure price is not negative
      if (menuItemData.price < 0) {
        return res.status(400).json({
          success: false,
          message: 'Price cannot be negative'
        });
      }
    }
    
    // If new image was uploaded
    if (req.file) {
      // Delete old image from Cloudinary if exists
      if (menuItem.imagePublicId) {
        await deleteFromCloudinary(menuItem.imagePublicId);
      }
      // Upload new image
      const result = await uploadToCloudinary(req.file.buffer, 'catering-app/menu-items');
      menuItemData.imageUrl = result.url;
      menuItemData.imagePublicId = result.public_id;
    }
    
    menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id, 
      { $set: menuItemData }, 
      { new: true }
    );
    
    // Debug: log isAvailable after saving
    console.log('isAvailable after saving:', menuItem.isAvailable, 'type:', typeof menuItem.isAvailable);
    
    res.json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete a menu item
// @route   DELETE /api/menu/:id
// @access  Private
exports.deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findOne({ 
      _id: req.params.id, 
      catererID: req.caterer.catererID 
    });
    
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }
    
    // Delete image from Cloudinary if exists
    if (menuItem.imagePublicId) {
      await deleteFromCloudinary(menuItem.imagePublicId);
    }
    
    await MenuItem.findByIdAndRemove(req.params.id);
    
    res.json({
      success: true,
      message: 'Menu item removed'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get menu items by category
// @route   GET /api/menu/category/:category
// @access  Private
exports.getMenuItemsByCategory = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ 
      catererID: req.caterer.catererID,
      category: req.params.category
    });
    
    res.json({
      success: true,
      data: menuItems
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 
