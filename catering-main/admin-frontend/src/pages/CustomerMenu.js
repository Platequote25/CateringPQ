import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCatererMenu, setCurrentCategory, addItem } from '../redux/slices/customerSlice';
import { toast } from 'react-toastify';

const CustomerMenu = () => {
  const { catererID } = useParams();
  const dispatch = useDispatch();
  const { 
    menuItems, 
    categories, 
    currentCategory, 
    loading, 
    pagination,
    selectedItems
  } = useSelector(state => state.customer);
  
  // Local state for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [dietaryFilter, setDietaryFilter] = useState('all'); // all, veg, non-veg
  const [currentPage, setCurrentPage] = useState(1);
  
  // Clear menuItems on mount to avoid stale data
  useEffect(() => {
    dispatch({ type: 'customer/clearMenuItems' });
  }, [dispatch]);
  
  // Fetch menu items on component mount and when filters change
  useEffect(() => {
    if (catererID) {
      const filters = {
        category: currentCategory || '',
        search: searchTerm,
        type: dietaryFilter !== 'all' ? dietaryFilter : '',
        minPrice: priceRange.min || '',
        maxPrice: priceRange.max || '',
        page: currentPage,
        limit: 12
      };
      
      dispatch(fetchCatererMenu({ catererID, filters }));
    }
  }, [catererID, currentCategory, searchTerm, dietaryFilter, priceRange, currentPage, dispatch]);
  
  // Handle category change
  const handleCategoryChange = (category) => {
    dispatch(setCurrentCategory(category));
    setCurrentPage(1); // Reset to first page when changing category
  };
  
  // Handle add to cart
  const handleAddToCart = (item) => {
    dispatch(addItem(item));
    toast.success(`Added ${item.name} to your selection`);
  };
  
  // Check if item is in cart
  const isItemInCart = (itemId) => {
    return selectedItems.some(item => item.itemId === itemId);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    const inrAmount = amount * 83;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(inrAmount);
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };
  
  // Handle price filter change
  const handlePriceChange = (type, value) => {
    setPriceRange(prev => ({
      ...prev,
      [type]: value
    }));
    setCurrentPage(1); // Reset to first page when changing price filter
  };
  
  // Handle dietary filter change
  const handleDietaryChange = (value) => {
    setDietaryFilter(value);
    setCurrentPage(1); // Reset to first page when changing dietary filter
  };
  
  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  // Generate pagination buttons
  const renderPagination = () => {
    const pages = [];
    const maxPages = pagination.pages || 1;
    
    // Always show first page
    pages.push(
      <button
        key="first"
        onClick={() => handlePageChange(1)}
        disabled={currentPage === 1}
        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
          currentPage === 1
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        1
      </button>
    );
    
    // Add ellipsis if needed
    if (currentPage > 3) {
      pages.push(
        <span key="ellipsis1" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
          ...
        </span>
      );
    }
    
    // Add pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(maxPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === maxPages) continue; // Skip first and last page as they're always shown
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
            currentPage === i
              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Add ellipsis if needed
    if (currentPage < maxPages - 2) {
      pages.push(
        <span key="ellipsis2" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
          ...
        </span>
      );
    }
    
    // Always show last page if there's more than one page
    if (maxPages > 1) {
      pages.push(
        <button
          key="last"
          onClick={() => handlePageChange(maxPages)}
          disabled={currentPage === maxPages}
          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
            currentPage === maxPages
              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {maxPages}
        </button>
      );
    }
    
    return pages;
  };
  
  // Add a handler for refresh button
  const handleRefreshMenu = async () => {
    await dispatch(fetchCatererMenu({ catererID, filters: {} }));
    toast.info('Menu refreshed! Unavailable items may have been removed.');
  };
  
  // Add this before rendering menuItems
  const visibleMenuItems = menuItems.filter(item => item.isAvailable === true);
  
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Our Menu</h1>
          <button
            onClick={handleRefreshMenu}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Refresh Menu
          </button>
        </div>
        <p className="mt-4 max-w-xl text-sm text-gray-700">
          Browse our selection of delicious dishes prepared with the finest ingredients.
        </p>
        
        {/* Filters */}
        <div className="pt-12 pb-6 flex flex-col lg:flex-row">
          {/* Category tabs */}
          <div className="flex-1 flex flex-col">
            <h2 className="text-sm font-medium text-gray-900">Categories</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentCategory === category
                      ? 'bg-primary-100 text-primary-800'
                      : 'text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
              {categories.length > 0 && (
                <button
                  onClick={() => handleCategoryChange('')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    !currentCategory
                      ? 'bg-primary-100 text-primary-800'
                      : 'text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  All Categories
                </button>
              )}
            </div>
          </div>
          
          {/* Search and filters */}
          <div className="mt-6 lg:mt-0 lg:ml-6 flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="text"
                  name="search"
                  id="search"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-3 pr-10 py-2 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search dishes..."
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Price range */}
            <div className="flex-1">
              <label htmlFor="price-min" className="block text-sm font-medium text-gray-700">Price Range</label>
              <div className="mt-1 flex space-x-2">
                <div className="relative rounded-md shadow-sm flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="price-min"
                    id="price-min"
                    value={priceRange.min}
                    onChange={(e) => handlePriceChange('min', e.target.value)}
                    className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 pr-3 py-2 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Min"
                    min="0"
                  />
                </div>
                <div className="relative rounded-md shadow-sm flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="price-max"
                    id="price-max"
                    value={priceRange.max}
                    onChange={(e) => handlePriceChange('max', e.target.value)}
                    className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 pr-3 py-2 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Max"
                    min="0"
                  />
                </div>
              </div>
            </div>
            
            {/* Dietary filter */}
            <div className="flex-1">
              <label htmlFor="dietary" className="block text-sm font-medium text-gray-700">Dietary</label>
              <select
                id="dietary"
                name="dietary"
                value={dietaryFilter}
                onChange={(e) => handleDietaryChange(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="all">All</option>
                <option value="veg">Vegetarian</option>
                <option value="non-veg">Non-Vegetarian</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Menu items grid */}
        <div className="mt-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : visibleMenuItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-y-10 sm:grid-cols-2 gap-x-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8">
              {visibleMenuItems.map((item) => (
                <div key={item._id} className="group">
                  <div className="w-full aspect-w-1 aspect-h-1 bg-gray-200 rounded-lg overflow-hidden xl:aspect-w-7 xl:aspect-h-8">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-center object-cover group-hover:opacity-75"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300">
                        <svg className="h-16 w-16 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex justify-between">
                    <div>
                      <h3 className="text-sm text-gray-700">{item.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">{item.category}</p>
                      {item.type && (
                        <p className="mt-1 text-xs inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
                          {item.type === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => handleAddToCart(item)}
                      className={`w-full flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                        isItemInCart(item._id)
                          ? 'border-primary-600 bg-primary-50 text-primary-700 hover:bg-primary-100'
                          : 'border-transparent bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      {isItemInCart(item._id) ? (
                        <>
                          <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Added to Selection
                        </>
                      ) : (
                        <>
                          <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                          Add to Selection
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No menu items found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {!loading && visibleMenuItems.length > 0 && pagination.pages > 1 && (
          <div className="mt-12 px-4 py-3 flex items-center justify-center sm:px-6">
            <div className="flex-1 flex justify-center">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {renderPagination()}
                
                <button
                  onClick={() => handlePageChange(Math.min(pagination.pages, currentPage + 1))}
                  disabled={currentPage === pagination.pages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                    currentPage === pagination.pages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerMenu; 