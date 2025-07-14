import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchMenuItems, updateMenuItem, deleteMenuItem, fetchCategories, addCategory } from '../../redux/slices/catererSlice';
import CatererNavbar from './CatererNavbar';
import './MenuManager.css';

const MenuManager = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { menuItems, loading, categories, categoriesLoading, categoriesError, isAuthenticated } = useSelector(state => state.caterer);
  const typeTabs = [
    { label: 'All', value: 'all', icon: '🍽️' },
    { label: 'Veg', value: 'veg', icon: '🥬' },
    { label: 'Non-Veg', value: 'non-veg', icon: '🍗' }
  ];

  const [currentType, setCurrentType] = useState('all');
  const [currentCategory, setCurrentCategory] = useState('all');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryError, setCategoryError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !localStorage.getItem('token')) {
      navigate('/caterer/login');
      return;
    }
    dispatch(fetchMenuItems());
    dispatch(fetchCategories());
  }, [dispatch, isAuthenticated, navigate]);

  const toggleAvailability = async (itemId) => {
    const item = menuItems.find(item => item._id === itemId);
    if (item) {
      const newAvailability = !(item.isAvailable === true);
      await dispatch(updateMenuItem({
        id: itemId,
        menuItemData: { ...item, isAvailable: newAvailability }
      }));
      dispatch(fetchMenuItems());
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      dispatch(deleteMenuItem(id)).then(() => dispatch(fetchMenuItems()));
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setCategoryError('');
    if (!newCategory.trim()) {
      setCategoryError('Category name is required');
      return;
    }
    try {
      await dispatch(addCategory(newCategory.trim())).unwrap();
      setShowCategoryModal(false);
      setNewCategory('');
      setCategoryError('');
      dispatch(fetchCategories());
    } catch (err) {
      setCategoryError(err || 'Failed to add category');
    }
  };

  if (loading || categoriesLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fff' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTop: '3px solid #ff5c8d', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
        <h3 style={{ color: '#333', fontWeight: 500, fontSize: 18 }}>Loading...</h3>
      </div>
    );
  }

  // Tabs: 'All' + backend categories
  const categoryTabs = [
    { label: 'All', value: 'all', icon: '📁' },
    ...categories.map(cat => ({ label: cat.name, value: cat.name, icon: '🏷️' }))
  ];

  const filteredItems = menuItems.filter(item => {
    const typeMatch = currentType === 'all' || item.type === currentType;
    const categoryMatch = currentCategory === 'all' || item.category === currentCategory;
    return typeMatch && categoryMatch;
  });

  return (
    <div className="menu-manager-layout">
      <CatererNavbar />
      <div className="menu-header" style={{ margin: '0 auto', maxWidth: 1200, padding: '32px 24px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
        <h1 className="page-title">Menu Manager</h1>
        <p className="text-lg" style={{ color: '#888', marginTop: 4 }}>Manage your menu items and categories</p>
        <div className="menu-header-actions" style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
          <button className="menu-btn-primary" onClick={() => navigate('/caterer/menu/add')}>+ Add Item</button>
          <button className="menu-btn-secondary" onClick={() => setShowCategoryModal(true)}>+ Category</button>
          <button className="menu-btn-refresh" onClick={() => dispatch(fetchMenuItems())}>Refresh</button>
          <button className="menu-btn-reset" onClick={() => { setCurrentType('all'); setCurrentCategory('all'); }}>Reset</button>
        </div>
      </div>
      <div className="menu-content" style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {/* Sidebar */}
        <aside className="menu-sidebar">
          <div className="menu-filter-section">
            <h3>Filter by Type</h3>
            <div className="menu-filter-options">
              {typeTabs.map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setCurrentType(tab.value)}
                  className={`menu-filter-option${currentType === tab.value ? ' active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="menu-filter-section">
            <h3>Filter by Category</h3>
            <div className="menu-filter-options">
              {categoryTabs.map(category => (
                <button
                  key={category.value}
                  onClick={() => setCurrentCategory(category.value)}
                  className={`menu-filter-option${currentCategory === category.value ? ' active' : ''}`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
        </aside>
        {/* Main Area */}
        <main className="menu-main" style={{ width: '100%' }}>
          <div className="menu-stats" style={{ marginBottom: 16 }}>
            Showing {filteredItems.length} of {menuItems.length} items
          </div>
          <div className="menu-grid">
            {filteredItems.length === 0 ? (
              <div className="menu-empty">
                <div className="menu-empty-icon">🍽️</div>
                <h3>No items found</h3>
                <p>Start building your menu by adding your first culinary creation</p>
                <button
                  onClick={() => navigate('/caterer/menu/add')}
                  className="menu-btn-primary"
                >
                  + Add Item
                </button>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={item._id} className="menu-card">
                  <div className="menu-card-image">
                    <img src={item.imageUrl || '/placeholder-food.jpg'} alt={item.name} />
                    <div className="menu-card-status">
                      <span className={item.isAvailable ? 'status-badge available' : 'status-badge unavailable'}>
                        {item.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                  <div className="menu-card-content">
                    <h3>{item.name}</h3>
                    <div className="menu-card-meta">
                      <span className="menu-card-type">{item.type}</span>
                      <span className="menu-card-category">{item.category}</span>
                    </div>
                    <p className="menu-card-description">{item.description}</p>
                    <div className="menu-card-actions">
                      <button
                        onClick={() => toggleAvailability(item._id)}
                        className={`menu-card-toggle${item.isAvailable ? ' active' : ''}`}
                      >
                        {item.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                      </button>
                      <div className="menu-card-buttons">
                        <button
                          onClick={() => navigate(`/caterer/menu/add?edit=${item._id}`)}
                          className="menu-card-btn edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="menu-card-btn delete"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
      {/* Category Modal */}
      {showCategoryModal && (
        <div className="menu-modal-overlay">
          <form onSubmit={handleAddCategory} className="menu-modal">
            <h2>Add New Category</h2>
            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="Enter category name..."
              autoFocus
            />
            {categoryError && <div className="menu-modal-error">{categoryError}</div>}
            <div className="menu-modal-actions">
              <button type="button" onClick={() => { setShowCategoryModal(false); setCategoryError(''); }} className="menu-modal-btn cancel">Cancel</button>
              <button type="submit" className="menu-modal-btn confirm">Add Category</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MenuManager;