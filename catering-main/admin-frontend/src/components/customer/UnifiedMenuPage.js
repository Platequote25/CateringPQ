import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useCustomerOrderContext } from '../../context/CustomerOrderContext';
import './UnifiedMenuPage.css';
import CustomDropdown from './CustomDropdown';

export default function UnifiedMenuPage({ guestCount, setGuestCount, onItemsSelected, goBack, miscCost = 0 }) {
  const { catererID: contextCatererID, setCatererID } = useCustomerOrderContext();

  // Persisted state for dropdowns
  const [menuType, setMenuType] = useState(() => localStorage.getItem('orderflow_menuType') || '');
  useEffect(() => localStorage.setItem('orderflow_menuType', menuType), [menuType]);

  const [category, setCategory] = useState(() => localStorage.getItem('orderflow_category') || '');
  useEffect(() => localStorage.setItem('orderflow_category', category), [category]);

  const [menuItems, setMenuItems] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [allMenuItems, setAllMenuItems] = useState({}); // Cache all menu items by category
  const [loading, setLoading] = useState(false);
  const [popularLoading, setPopularLoading] = useState(false);
  const [error, setError] = useState('');
  const [quantities, setQuantities] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [activeTab, setActiveTab] = useState('category'); // 'category' or 'popular'

  // State for guest count input to prevent cursor jumping
  const [localGuestCount, setLocalGuestCount] = useState(guestCount);

  // Persisted state for all selected items, now storing full item details
  const [allSelectedItems, setAllSelectedItems] = useState(() => {
    const saved = localStorage.getItem('orderflow_allSelectedItems');
    return saved ? JSON.parse(saved) : {};
  });
  useEffect(() => {
    localStorage.setItem('orderflow_allSelectedItems', JSON.stringify(allSelectedItems));
  }, [allSelectedItems]);

  // Rehydrate allSelectedItems and quantities from localStorage on mount (only once)
  const [rehydrated, setRehydrated] = useState(false);
  useEffect(() => {
    if (!rehydrated) {
      const savedItems = localStorage.getItem('orderflow_allSelectedItems');
      if (savedItems) {
        setAllSelectedItems(JSON.parse(savedItems));
      }
      const savedQuantities = localStorage.getItem('orderflow_quantities');
      if (savedQuantities) {
        setQuantities(JSON.parse(savedQuantities));
      }
      setRehydrated(true);
    }
  }, [rehydrated]);

  // Sync displayed quantities with the master list of selected items (after both are loaded)
  useEffect(() => {
    if (!rehydrated) return;
    const q = {};
    menuItems.forEach(item => {
      q[item._id] = allSelectedItems[item._id]?.quantity || 0;
    });
    setQuantities(q);
  }, [menuItems, allSelectedItems, rehydrated]);

  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState('');

  // Refs for polling
  const pollingIntervalRef = useRef(null);
  const lastRefreshTimeRef = useRef(Date.now());
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const previousMenuItemsRef = useRef([]);
  const [newlyAvailableItems, setNewlyAvailableItems] = useState(new Set());

  const [searchTerm, setSearchTerm] = useState('');

  const menuTypes = [
    { value: 'veg', label: 'Vegetarian' },
    { value: 'non-veg', label: 'Non-Vegetarian' },
    { value: 'both', label: 'Both' }
  ];

  // Function to show notification
  const showNotification = (message, type = 'info') => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications(prev => [...prev, notification]);

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Function to check for availability changes
  const checkAvailabilityChanges = (newItems, oldItems) => {
    const newAvailable = newItems.filter(item => item.isAvailable === true);
    const oldAvailable = oldItems.filter(item => item.isAvailable === true);

    // Check for newly available items
    const newlyAvailable = newAvailable.filter(newItem =>
      !oldAvailable.find(oldItem => oldItem._id === newItem._id)
    );

    // Check for newly unavailable items
    const newlyUnavailable = oldAvailable.filter(oldItem =>
      !newAvailable.find(newItem => newItem._id === oldItem._id)
    );

    if (newlyAvailable.length > 0) {
      const itemNames = newlyAvailable.map(item => item.name).join(', ');
      showNotification(`🎉 ${itemNames} is now available!`, 'success');

      // Add newly available items to the set for highlighting
      setNewlyAvailableItems(prev => {
        const newSet = new Set(prev);
        newlyAvailable.forEach(item => newSet.add(item._id));
        return newSet;
      });

      // Remove highlight after 10 seconds
      setTimeout(() => {
        setNewlyAvailableItems(prev => {
          const newSet = new Set(prev);
          newlyAvailable.forEach(item => newSet.delete(item._id));
          return newSet;
        });
      }, 10000);
    }

    if (newlyUnavailable.length > 0) {
      const itemNames = newlyUnavailable.map(item => item.name).join(', ');
      showNotification(`⚠️ ${itemNames} is no longer available.`, 'warning');
    }
  };

  // Function to fetch popular items
  const fetchPopularItems = async () => {
    if (!contextCatererID) return;
    try {
      const res = await fetch(`/api/customer/${contextCatererID}/menu/popular`);
      const data = await res.json();
      if (data.success) {
        setPopularItems(data.menuItems || []);
      }
    } catch (err) {
      // Swallow error silently in production
    }
  };

  // Function to fetch menu items by category
  const fetchMenuItemsByCategory = async (categoryName) => {
    if (!categoryName) return;

    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/menu/category/${categoryName}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAllMenuItems(prev => ({ ...prev, [categoryName]: data.data }));
        return data.data;
      } else {
        setError('Failed to fetch menu items.');
        return null;
      }
    } catch (err) {
      setError('Failed to fetch menu items.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh all data
  const refreshAllData = async () => {
    lastRefreshTimeRef.current = Date.now();
    setLastUpdated(new Date());

    // Store previous menu items for comparison
    const previousItems = [...menuItems];

    // Refresh popular items
    await fetchPopularItems();

    // Refresh current category if active
    if (activeTab === 'category' && category) {
      await fetchMenuItemsByCategory(category);
    }

    // Check for availability changes after a short delay to ensure state is updated
    setTimeout(() => {
      checkAvailabilityChanges(menuItems, previousItems);
    }, 100);
  };

  // Set up polling for real-time updates
  useEffect(() => {
    // Only refresh data once on mount or when dependencies change
    refreshAllData();
    // No polling interval
  }, [contextCatererID, activeTab, category]);

  // Sync local guest count with parent/context state
  useEffect(() => {
    setLocalGuestCount(guestCount);
  }, [guestCount]);

  // Set catererID in context if not already set
  useEffect(() => {
    if (contextCatererID !== undefined) {
      setCatererID(contextCatererID);
    }
  }, [contextCatererID, setCatererID]);

  // Fetch categories dynamically from backend
  useEffect(() => {
    setCategoriesLoading(true);
    setCategoriesError('');
    const token = localStorage.getItem('token');
    fetch('/api/menu/categories', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCategories(data.categories);
        } else {
          setCategoriesError('Failed to fetch categories.');
        }
      })
      .catch(() => setCategoriesError('Failed to fetch categories.'))
      .finally(() => setCategoriesLoading(false));
  }, []);

  // Fetch menu items and filter them
  useEffect(() => {
    if (activeTab === 'popular') {
      // For popular tab, use popular items
      const filterAndDisplay = (items) => {
        let filteredMenu = items;
        if (menuType && menuType !== 'both') {
          filteredMenu = items.filter(item => {
            if (!item.type) return false;
            const type = item.type.toLowerCase().trim();
            const selectedType = menuType.toLowerCase().trim();
            return type === selectedType;
          });
        }
        // Only show available items
        filteredMenu = filteredMenu.filter(item => item.isAvailable === true);
        setMenuItems(filteredMenu);
      };

      filterAndDisplay(popularItems);
      return;
    }

    if (!category) {
      setMenuItems([]);
      return;
    }

    const filterAndDisplay = (items) => {
      let filteredMenu = items;
      if (menuType && menuType !== 'both') {
        filteredMenu = items.filter(item => {
          if (!item.type) return false;
          const type = item.type.toLowerCase().trim();
          const selectedType = menuType.toLowerCase().trim();
          return type === selectedType;
        });
      }
      // Only show available items
      filteredMenu = filteredMenu.filter(item => item.isAvailable === true);
      setMenuItems(filteredMenu);
    };

    // Use cached data if available
    if (allMenuItems[category]) {
      filterAndDisplay(allMenuItems[category]);
    } else {
      // Otherwise, fetch new data
      fetchMenuItemsByCategory(category).then(data => {
        if (data) {
          filterAndDisplay(data);
        }
      });
    }
  }, [category, menuType, allMenuItems, activeTab, popularItems]);

  // Remove unavailable items from cart and alert if any were present
  useEffect(() => {
    const unavailableIds = Object.values(allSelectedItems)
      .filter(item => item.isAvailable !== true)
      .map(item => item._id);

    if (unavailableIds.length > 0) {
      const removedItems = Object.values(allSelectedItems)
        .filter(item => unavailableIds.includes(item._id))
        .map(item => item.name);

      setAllSelectedItems(prev => {
        const updated = { ...prev };
        unavailableIds.forEach(id => delete updated[id]);
        return updated;
      });

      // Show a more informative notification
      const itemNames = removedItems.join(', ');
      const message = removedItems.length === 1
        ? `"${itemNames}" is no longer available and has been removed from your cart.`
        : `The following items are no longer available and have been removed from your cart: ${itemNames}`;

      showNotification(message, 'warning');
    }
  }, [menuItems, allSelectedItems]);

  const handleGuestCountChange = (e) => {
    setLocalGuestCount(e.target.value); // Update local state for smooth typing
    setGuestCount(e.target.value);     // Update parent/context state
  };

  const handleQuantityChange = (id, delta) => {
    const increment = 1;
    const item = menuItems.find(i => i._id === id);
    if (!item) return;

    if (item.isAvailable !== true) {
      alert('This item is not available and cannot be added to your cart.');
      return;
    }

    setQuantities(q => {
      const currentQuantity = q[id] || 0;
      let newQuantity = currentQuantity + (delta * increment);

      // Clamp between 0 and 1
      newQuantity = Math.max(0, Math.min(1, newQuantity));

      // Update master list of all selected items
      setAllSelectedItems(prev => {
        const updated = { ...prev };
        if (newQuantity > 0) {
          updated[id] = {
            ...item,
            quantity: newQuantity,
            category: category, // Store category with the item
          };
        } else {
          delete updated[id];
        }
        return updated;
      });

      return { ...q, [id]: newQuantity };
    });
  };
  const getSelectedItems = () => {
    // Only include available items in calculations
    return Object.values(allSelectedItems).filter(item => item.isAvailable === true);
  };

  const getTotalItems = () => {
    return getSelectedItems().reduce((acc, item) => acc + (item.quantity), 0);
  };

  const getSubtotal = () => {
    return getSelectedItems().reduce((acc, item) => acc + (item.price * item.quantity * localGuestCount), 0);
  };

  const getTotal = () => {
    return getSubtotal() + Number(miscCost || 0);
  };

  const handleRemoveItem = (itemId) => {
    // Remove from master list
    setAllSelectedItems(prev => {
      const updated = { ...prev };
      delete updated[itemId];
      return updated;
    });
    // Update local quantities for the currently viewed category
    setQuantities(q => ({ ...q, [itemId]: 0 }));
  };

  const handleClearCart = () => {
    setAllSelectedItems({});
    setQuantities({});
  };

  const handleProceedToSummary = () => {
    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0) {
      setError('Please add at least one item to your order.');
      return;
    }

    // Pass selected items to parent component
    onItemsSelected(selectedItems);
  };

  // Update formatCurrency to multiply by 83 for USD to INR
  const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  // Filtered menu items based on search term
  const filteredMenuItems = useMemo(() => menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [menuItems, searchTerm]);
  const filteredPopularItems = useMemo(() => popularItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [popularItems, searchTerm]);

  return (
    <div className="unified-menu-container">
      {/* Notifications */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification notification-${notification.type}`}>
            {notification.message}
            <button
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              className="notification-close"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Back Button */}
      <button className="unified-back-btn" onClick={goBack} style={{ marginBottom: '1rem' }}>
        ← Back
      </button>
      {/* Header with guest count and cart */}
      <div className="unified-header">
        <div className="unified-guest-count">
          <span>Guests: </span>
          <input
            type="number"
            min="1"
            value={localGuestCount}
            onChange={handleGuestCountChange}
            className="guest-count-input"
            title="Edit guest count"
          />
        </div>
        <div className="unified-cart-icon" onClick={() => setShowCart(!showCart)}>
          🛒
          {getTotalItems() > 0 && <span className="cart-indicator"></span>}
        </div>
      </div>

      {/* Dropdowns */}
      <div className="unified-dropdowns">
        <div className="dropdown-group">
          <label>Menu Type:</label>
          <CustomDropdown
            options={menuTypes}
            value={menuType}
            onChange={(value) => setMenuType(value)}
            placeholder="Select Type"
          />
        </div>

        {/* Category Dropdown */}
        <div className="dropdown-group">
          <label>Category:</label>
          <CustomDropdown
            options={categories.map(cat => ({ value: cat.name, label: cat.name }))}
            value={category}
            onChange={setCategory}
            placeholder="Select Category"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="unified-tabs">
        <button
          className={`unified-tab ${activeTab === 'category' ? 'active' : ''}`}
          onClick={() => setActiveTab('category')}
        >
          Browse by Category
        </button>
        <button
          className={`unified-tab ${activeTab === 'popular' ? 'active' : ''}`}
          onClick={() => setActiveTab('popular')}
        >
          Popular Items
        </button>
      </div>

      {/* Menu Items */}
      <div className="menu-search-bar" style={{ margin: '16px 0', display: 'flex', justifyContent: 'center' }}>
        <input
          type="text"
          placeholder="Search menu items..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ width: '100%', maxWidth: 400, padding: 10, borderRadius: 8, border: '1px solid #ddd', fontSize: 16 }}
        />
      </div>
      <div className="unified-menu-content">
        {activeTab === 'popular' ? (
          popularLoading ? (
            <div className="loading-message">Loading popular items...</div>
          ) : popularItems.length === 0 ? (
            <div className="empty-message">No popular items available.</div>
          ) : (loading ? (
            <div className="loading-message">Loading menu...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : menuItems.length === 0 ? (
            <div className="empty-message">
              No items found for selected criteria.
            </div>
          ) : (
            <div className="menu-items-grid">
              {filteredPopularItems.map(item => (
                <div
                  className={`menu-item-card ${newlyAvailableItems.has(item._id) ? 'newly-available' : ''}`}
                  key={item._id}
                >
                  {newlyAvailableItems.has(item._id) && (
                    <div className="newly-available-badge">🆕 Just Available!</div>
                  )}
                  <img
                    className="menu-item-image"
                    src={item.imageUrl || '/orderflow/placeholder.jpg'}
                    alt={item.name}
                  />
                  <div className="menu-item-content">
                    <h3 className="menu-item-title">{item.name}</h3>
                    <p className="menu-item-description">{item.description}</p>
                    <div className="menu-item-price">{formatCurrency(item.price)}</div>
                    <div className="menu-item-actions">
                      <div className="quantity-control">
                        <button
                          onClick={() => handleQuantityChange(item._id, -1)}
                          className="quantity-btn"
                          disabled={!quantities[item._id]}
                        >
                          -
                        </button>
                        <span className="quantity-display">{quantities[item._id] || 0}</span>
                        <button
                          onClick={() => handleQuantityChange(item._id, 1)}
                          className="quantity-btn"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          loading ? (
            <div className="loading-message">Loading menu...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : menuItems.length === 0 ? (
            <div className="empty-message">
              {category ? 'No items found for selected criteria.' : 'Please select a category to view items.'}
            </div>
          ) : (
            <div className="menu-items-grid">
              {filteredMenuItems.map(item => (
                <div
                  className={`menu-item-card ${newlyAvailableItems.has(item._id) ? 'newly-available' : ''}`}
                  key={item._id}
                >
                  {newlyAvailableItems.has(item._id) && (
                    <div className="newly-available-badge">🆕 Just Available!</div>
                  )}
                  <img
                    className="menu-item-image"
                    src={item.imageUrl || '/orderflow/placeholder.jpg'}
                    alt={item.name}
                  />
                  <div className="menu-item-content">
                    <h3 className="menu-item-title">{item.name}</h3>
                    <p className="menu-item-description">{item.description}</p>
                    <div className="menu-item-price">{formatCurrency(item.price)}</div>
                    <div className="menu-item-actions">
                      <div className="quantity-control">
                        <button
                          onClick={() => handleQuantityChange(item._id, -1)}
                          className="quantity-btn"
                          disabled={quantities[item._id] === 0}
                        >
                          -
                        </button>
                        <span className="quantity-display">{quantities[item._id] || 0}</span>
                        <button
                          onClick={() => handleQuantityChange(item._id, 1)}
                          className="quantity-btn"
                          disabled={quantities[item._id] === 1}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Cart Modal/Bottom Panel */}
      {showCart && (
        <div className="cart-overlay" onClick={() => setShowCart(false)}>
          <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
            <div className="cart-header">
              <h3>Your Order</h3>
              <button onClick={() => setShowCart(false)} className="close-btn">&times;</button>
            </div>

            <div className="cart-content">
              <div className="cart-summary">
                <div className="summary-row">
                  <span>Guests:</span>
                  <input
                    type="number"
                    min="1"
                    value={localGuestCount}
                    onChange={handleGuestCountChange}
                    className="guest-input"
                  />
                </div>
                <div className="summary-row">
                  <span>Miscellaneous Cost:</span>
                  <span>{formatCurrency(miscCost)}</span>
                </div>
                <div className="summary-row">
                  <span>Total Items:</span>
                  <span>{getTotalItems()}</span>
                </div>
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(getSubtotal())}</span>
                </div>
              </div>

              <div className="cart-items">
                {getSelectedItems().map(item => (
                  <div key={item._id} className="cart-item">
                    <span>{item.name} (x{item.quantity * localGuestCount})</span>
                    <div className="cart-item-actions">
                      <span>{formatCurrency(item.price * item.quantity * localGuestCount)}</span>
                      <button onClick={() => handleRemoveItem(item._id)} className="remove-btn">
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-total">
                <strong>Total: {formatCurrency(getTotal())}</strong>
              </div>

              <div className="cart-actions">
                <button onClick={handleClearCart} className="clear-btn">Clear All</button>
                <button
                  onClick={handleProceedToSummary}
                  className="confirm-btn"
                  disabled={getTotalItems() === 0}
                >
                  Proceed to Summary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 