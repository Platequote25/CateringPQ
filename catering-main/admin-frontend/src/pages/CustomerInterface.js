import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchCatererMenu, 
  addItem, 
  removeItem, 
  updateGuestCount, 
  calculateQuote 
} from '../redux/slices/customerSlice';

const CustomerInterface = () => {
  const { catererID } = useParams();
  const dispatch = useDispatch();
  const { 
    catererInfo, 
    menuItems, 
    categories, 
    selectedItems, 
    currentCategory, 
    totalCost, 
    perPlateCost, 
    discount, 
    guestCount, 
    loading, 
    error 
  } = useSelector(state => state.customer);
  
  // Local UI state
  const [showQuote, setShowQuote] = useState(false);
  const [showCart, setShowCart] = useState(false);
  
  useEffect(() => {
    if (catererID) {
      dispatch(fetchCatererMenu(catererID));
    }
  }, [catererID, dispatch]);
  
  // Filter menu items by current category
  const filteredMenuItems = menuItems.filter(item => item.category === currentCategory);
  
  const handleAddItem = (item) => {
    dispatch(addItem(item));
  };
  
  const handleRemoveItem = (itemId) => {
    dispatch(removeItem(itemId));
  };
  
  const handleGuestCountChange = (e) => {
    const value = parseInt(e.target.value, 10) || 0;
    dispatch(updateGuestCount(value));
  };
  
  const handleCategoryChange = (category) => {
    dispatch({ type: 'customer/setCurrentCategory', payload: category });
  };
  
  const handleCalculateQuote = () => {
    if (guestCount < 1) {
      alert('Please enter the number of guests');
      return;
    }
    
    if (selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }
    
    // Format the data correctly for the API
    const quoteData = {
      selectedItems: selectedItems.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity
      })),
      guestCount: guestCount
    };
    
    dispatch(calculateQuote({
      catererID,
      quoteData
    }));
    
    setShowQuote(true);
  };
  
  const calculateItemsInCart = () => {
    return selectedItems.reduce((total, item) => total + item.quantity, 0);
  };
  
  const itemCountInCart = calculateItemsInCart();
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  if (loading && !menuItems.length) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl text-gray-500">Loading menu...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-indigo-600">{catererInfo?.businessName || 'Catering Service'}</h1>
            </div>
            <div className="ml-4 flex items-center">
              {/* Cart button with count */}
              <button
                onClick={() => setShowCart(!showCart)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Cart {itemCountInCart > 0 && `(${itemCountInCart})`}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Guest Count Section */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h2 className="text-lg leading-6 font-medium text-gray-900">How many guests are you expecting?</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the guest count to calculate pricing
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="number"
                  min="1"
                  value={guestCount}
                  onChange={handleGuestCountChange}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md w-24 mr-4"
                />
                <button
                  onClick={handleCalculateQuote}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Calculate Quote
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quote summary if available */}
        {showQuote && (
          <div className="bg-green-50 shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              {error ? (
                <div className="text-red-600 font-medium">
                  Error calculating quote: {error}
                </div>
              ) : totalCost > 0 ? (
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Quote Summary
                    </h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                      <p>Based on {guestCount} guests</p>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                        <div className="text-sm font-medium text-gray-900">Cost per plate</div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(typeof perPlateCost === 'number' ? perPlateCost : parseFloat(perPlateCost || 0))}
                        </div>
                      </div>
                      {discount > 0 && (
                        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                          <div className="text-sm font-medium text-green-600">Volume discount</div>
                          <div className="text-sm font-medium text-green-600">-{discount}%</div>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                        <div className="text-base font-bold text-gray-900">Total estimated cost</div>
                        <div className="text-base font-bold text-gray-900">
                          {formatCurrency(typeof totalCost === 'number' ? totalCost : parseFloat(totalCost || 0))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">Calculating your quote...</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Menu Categories */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto p-4" aria-label="Tabs">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`
                    whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm rounded-md capitalize
                    ${currentCategory === category
                      ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {category}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Menu Items Grid */}
          <div className="p-4">
            {filteredMenuItems.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">No items available in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMenuItems.map((item) => (
                  <div key={item._id} className="bg-white overflow-hidden shadow-sm border border-gray-200 rounded-lg">
                    {item.imageUrl && (
                      <div className="h-48 w-full overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="px-4 py-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg leading-6 font-medium text-gray-900">
                            {item.name}
                          </h3>
                          <div className="flex items-center mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.type === 'veg' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {item.type === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}
                            </span>
                            {item.isPopular && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Popular
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(parseFloat(item.price))}
                        </div>
                      </div>
                      
                      {item.description && (
                        <p className="mt-2 text-sm text-gray-500">
                          {item.description}
                        </p>
                      )}
                      
                      <div className="mt-4 flex items-center justify-between">
                        <button
                          onClick={() => handleAddItem(item)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Add to Cart
                        </button>
                        
                        {/* Show item quantity if already in cart */}
                        {selectedItems.some(i => i.itemId === item._id) && (
                          <div className="flex items-center">
                            <button
                              onClick={() => handleRemoveItem(item._id)}
                              className="inline-flex items-center px-2 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              -
                            </button>
                            <span className="px-3">
                              {selectedItems.find(i => i.itemId === item._id)?.quantity || 0}
                            </span>
                            <button
                              onClick={() => handleAddItem(item)}
                              className="inline-flex items-center px-2 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 overflow-hidden z-40">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                 onClick={() => setShowCart(false)}></div>
            
            <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
              <div className="w-screen max-w-md">
                <div className="h-full divide-y divide-gray-200 flex flex-col bg-white shadow-xl">
                  <div className="flex-1 h-0 overflow-y-auto">
                    <div className="py-6 px-4 bg-indigo-700 sm:px-6">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium text-white">Your Cart</h2>
                        <div className="ml-3 h-7 flex items-center">
                          <button
                            onClick={() => setShowCart(false)}
                            className="bg-indigo-700 rounded-md text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                          >
                            <span className="sr-only">Close panel</span>
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-indigo-300">
                          {selectedItems.length === 0 
                            ? 'Your cart is empty' 
                            : `${itemCountInCart} item${itemCountInCart !== 1 ? 's' : ''} in your cart`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="px-4 sm:px-6">
                        <div className="mt-6">
                          <ul className="divide-y divide-gray-200">
                            {selectedItems.map((item) => (
                              <li key={item.itemId} className="py-4 flex">
                                <div className="flex-1 flex flex-col">
                                  <div>
                                    <div className="flex justify-between text-base font-medium text-gray-900">
                                      <h3>{item.name}</h3>
                                      <p className="ml-4">{formatCurrency(parseFloat(item.price * item.quantity))}</p>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">{formatCurrency(parseFloat(item.price))} each</p>
                                  </div>
                                  <div className="flex-1 flex items-end justify-between text-sm">
                                    <div className="flex">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveItem(item.itemId)}
                                        className="font-medium text-indigo-600 hover:text-indigo-500 mr-4"
                                      >
                                        Remove
                                      </button>
                                      
                                      <div className="flex items-center border border-gray-300 rounded-md">
                                        <button
                                          onClick={() => handleRemoveItem(item.itemId)}
                                          className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                        >
                                          -
                                        </button>
                                        <span className="px-2">
                                          {item.quantity}
                                        </span>
                                        <button
                                          onClick={() => handleAddItem({ _id: item.itemId, name: item.name, price: item.price })}
                                          className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                        >
                                          +
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 p-6">
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <p>Guest Count</p>
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="1"
                          value={guestCount}
                          onChange={handleGuestCountChange}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 rounded-md w-24"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <button
                        onClick={handleCalculateQuote}
                        className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Calculate Quote
                      </button>
                    </div>
                    <div className="mt-6 flex justify-center text-sm text-center text-gray-500">
                      <p>
                        <button
                          type="button"
                          className="text-indigo-600 font-medium hover:text-indigo-500"
                          onClick={() => setShowCart(false)}
                        >
                          Continue Shopping
                          <span aria-hidden="true"> &rarr;</span>
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerInterface; 