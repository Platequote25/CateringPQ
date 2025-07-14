const Category = require('../models/Category');

// Get all categories for a caterer
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ catererID: req.caterer.catererID }).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// Add a new category for a caterer
exports.addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    // Check for duplicate
    const exists = await Category.findOne({ catererID: req.caterer.catererID, name: name.trim() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }
    const category = new Category({ name: name.trim(), catererID: req.caterer.catererID });
    await category.save();
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}; 