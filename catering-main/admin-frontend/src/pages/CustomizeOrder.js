import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  removeItem, 
  updateGuestCount, 
  calculateQuote, 
  setCurrentStep 
} from '../redux/slices/customerSlice';
import { toast } from 'react-toastify';

const CustomizeOrder = () => {
  const { catererID } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { 
    selectedItems, 
    guestCount, 
    loading, 
    error,
    catererInfo
  } = useSelector(state => state.customer);
  
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState('');
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Calculate subtotal
  const calculateSubtotal = () => {
    return selectedItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };
  
  // Handle guest count change
  const handleGuestCountChange = (e) => {
    const count = parseInt(e.target.value, 10) || 0;
    dispatch(updateGuestCount(count));
  };
  
  // Handle quantity change
  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      dispatch(removeItem(itemId));
    } else {
      // Find the item and update its quantity
      const item = selectedItems.find(item => item.itemId === itemId);
      if (item) {
        for (let i = item.quantity; i < newQuantity; i++) {
          dispatch({ type: 'customer/addItem', payload: { _id: itemId, name: item.name, price: item.price } });
        }
        
        for (let i = item.quantity; i > newQuantity; i--) {
          dispatch(removeItem(itemId));
        }
      }
    }
  };
  
  // Handle remove item
  const handleRemoveItem = (itemId) => {
    dispatch(removeItem(itemId));
    toast.info('Item removed from selection');
  };
  
  // Get quote and proceed to next step
  const handleGetQuote = () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one menu item');
      return;
    }
    
    if (guestCount <= 0) {
      toast.error('Please enter a valid guest count');
      return;
    }
    
    if (!eventDate) {
      toast.error('Please select an event date');
      return;
    }
    
    const quoteData = {
      selectedItems,
      guestCount,
      eventDate,
      specialRequirements,
      dietaryRestrictions
    };
    
    dispatch(calculateQuote({ catererID, quoteData }))
      .unwrap()
      .then(() => {
        dispatch(setCurrentStep('quote'));
        navigate(`/customer/${catererID}/quote`);
      })
      .catch(err => {
        toast.error(err || 'Failed to calculate quote');
      });
  };
  
  // Check if form is valid
  const isFormValid = () => {
    return selectedItems.length > 0 && guestCount > 0 && eventDate;
  };
  
  // Set minimum date to tomorrow
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  
  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-extrabold text-gray-900">Customize Your Order</h1>
          
          {/* Guest count */}
          <div className="mt-10">
            <h2 className="text-lg font-medium text-gray-900">Event Details</h2>
            <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
              <div>
                <label htmlFor="guest-count" className="block text-sm font-medium text-gray-700">
                  Number of Guests
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    id="guest-count"
                    name="guest-count"
                    min="1"
                    value={guestCount || ''}
                    onChange={handleGuestCountChange}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="event-date" className="block text-sm font-medium text-gray-700">
                  Event Date
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    id="event-date"
                    name="event-date"
                    min={getMinDate()}
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="dietary-restrictions" className="block text-sm font-medium text-gray-700">
                  Dietary Restrictions
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="dietary-restrictions"
                    name="dietary-restrictions"
                    value={dietaryRestrictions}
                    onChange={(e) => setDietaryRestrictions(e.target.value)}
                    placeholder="e.g., Gluten-free, Nut allergies, etc."
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="sm:col-span-2">
                <label htmlFor="special-requirements" className="block text-sm font-medium text-gray-700">
                  Special Requirements
                </label>
                <div className="mt-1">
                  <textarea
                    id="special-requirements"
                    name="special-requirements"
                    rows={3}
                    value={specialRequirements}
                    onChange={(e) => setSpecialRequirements(e.target.value)}
                    placeholder="Any special requests or additional information"
                    className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Selected items */}
          <div className="mt-10">
            <h2 className="text-lg font-medium text-gray-900">Selected Items</h2>
            
            {selectedItems.length === 0 ? (
              <div className="mt-6 text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No items selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start by adding some items from our menu.
                </p>
                <div className="mt-6">
                  <Link
                    to={`/customer/${catererID}/menu`}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Browse Menu
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-6 flow-root">
                <ul className="-my-6 divide-y divide-gray-200">
                  {selectedItems.map((item) => (
                    <li key={item.itemId} className="py-6 flex">
                      <div className="flex-1 flex flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <h3>{item.name}</h3>
                            <p className="ml-4">{formatCurrency(item.price * item.quantity)}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">{formatCurrency(item.price)} each</p>
                        </div>
                        <div className="flex-1 flex items-end justify-between text-sm">
                          <div className="flex items-center">
                            <label htmlFor={`quantity-${item.itemId}`} className="mr-2 text-gray-500">Qty</label>
                            <select
                              id={`quantity-${item.itemId}`}
                              name={`quantity-${item.itemId}`}
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(item.itemId, parseInt(e.target.value, 10))}
                              className="max-w-full rounded-md border border-gray-300 py-1.5 text-base leading-5 font-medium text-gray-700 text-left shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            >
                              {[...Array(20).keys()].map((num) => (
                                <option key={num + 1} value={num + 1}>
                                  {num + 1}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="flex">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.itemId)}
                              className="font-medium text-primary-600 hover:text-primary-500"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-between text-base font-medium text-gray-900">
                    <p>Subtotal</p>
                    <p>{formatCurrency(calculateSubtotal())}</p>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Additional charges may apply based on your selections and requirements.
                  </p>
                  
                  <div className="mt-6 flex justify-between">
                    <Link
                      to={`/customer/${catererID}/menu`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Continue Shopping
                    </Link>
                    <button
                      type="button"
                      onClick={handleGetQuote}
                      disabled={!isFormValid() || loading}
                      className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                        isFormValid() && !loading
                          ? 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                          : 'bg-gray-300 cursor-not-allowed'
                      }`}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        'Get Quote'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizeOrder; 