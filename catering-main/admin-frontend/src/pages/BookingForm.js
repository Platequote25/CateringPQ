import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  submitBooking, 
  checkDateAvailability, 
  setCurrentStep 
} from '../redux/slices/customerSlice';
import { toast } from 'react-toastify';

const BookingForm = () => {
  const { catererID } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { 
    quote, 
    selectedItems, 
    guestCount, 
    totalCost, 
    loading, 
    error,
    dateAvailability
  } = useSelector(state => state.customer);
  
  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    eventDate: '',
    eventTime: '',
    venue: '',
    venueAddress: '',
    specialInstructions: '',
    paymentMethod: 'credit_card',
    agreeToTerms: false
  });
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // If quote exists, pre-fill event date
  useEffect(() => {
    if (quote && quote.eventDate) {
      setFormData(prev => ({
        ...prev,
        eventDate: new Date(quote.eventDate).toISOString().split('T')[0]
      }));
      
      // Check date availability
      dispatch(checkDateAvailability({ 
        catererID, 
        date: new Date(quote.eventDate).toISOString().split('T')[0]
      }));
    }
  }, [quote, catererID, dispatch]);
  
  // Handle input change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    
    // Check date availability when event date changes
    if (name === 'eventDate' && value) {
      dispatch(checkDateAvailability({ catererID, date: value }));
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Name is required';
    }
    
    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Email is invalid';
    }
    
    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Phone number is required';
    } else if (!/^\+?[\d\s()-]{10,15}$/.test(formData.customerPhone.replace(/\s+/g, ''))) {
      newErrors.customerPhone = 'Phone number is invalid';
    }
    
    if (!formData.eventDate) {
      newErrors.eventDate = 'Event date is required';
    }
    
    if (!formData.eventTime) {
      newErrors.eventTime = 'Event time is required';
    }
    
    if (!formData.venue.trim()) {
      newErrors.venue = 'Venue name is required';
    }
    
    if (!formData.venueAddress.trim()) {
      newErrors.venueAddress = 'Venue address is required';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    // Check date availability
    if (dateAvailability === false) {
      newErrors.eventDate = 'This date is not available';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!quote) {
      toast.error('Please get a quote first');
      navigate(`/customer/${catererID}/customize`);
      return;
    }
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      const bookingData = {
        ...formData,
        quoteId: quote.quoteId,
        guestCount,
        selectedItems: selectedItems.map(item => ({
          ...item,
          eventDate: formData.eventDate
        })),
        totalAmount: totalCost,
        specialRequirements: quote.specialRequirements || formData.specialInstructions,
        // Include additional quote details
        eventDate: formData.eventDate || quote.eventDate,
        venue: formData.venue,
        venueAddress: formData.venueAddress
      };
      
      console.log("Submitting booking with data:", bookingData);
      
      dispatch(submitBooking({ catererID, bookingData }))
        .unwrap()
        .then(() => {
          toast.success('Booking submitted successfully!');
          dispatch(setCurrentStep('confirmation'));
          navigate(`/customer/${catererID}/confirmation`);
        })
        .catch(err => {
          toast.error(err || 'Failed to submit booking');
          setIsSubmitting(false);
        });
    } else {
      // Scroll to first error
      const firstError = document.querySelector('.error-message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Set minimum date to tomorrow
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  
  // If no quote is available, redirect to customize page
  if (!quote) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No quote available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please customize your order first to get a quote.
          </p>
          <div className="mt-6">
            <Link
              to={`/customer/${catererID}/customize`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Customize Order
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <div className="px-4 sm:px-0">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Booking Information</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Please provide your details to complete your booking.
                </p>
                
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-900">Order Summary</h4>
                  <p className="mt-2 text-sm text-gray-500">
                    {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} for {guestCount} guest{guestCount !== 1 ? 's' : ''}
                  </p>
                  <p className="mt-1 text-sm font-medium text-gray-900">
                    Total: {formatCurrency(totalCost)}
                  </p>
                  
                  <div className="mt-4">
                    <Link
                      to={`/customer/${catererID}/quote`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-500"
                    >
                      View quote details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-5 md:mt-0 md:col-span-2">
              <form onSubmit={handleSubmit}>
                <div className="shadow overflow-hidden sm:rounded-md">
                  <div className="px-4 py-5 bg-white sm:p-6">
                    <div className="grid grid-cols-6 gap-6">
                      {/* Customer details */}
                      <div className="col-span-6">
                        <h4 className="text-md font-medium text-gray-900">Customer Details</h4>
                      </div>
                      
                      <div className="col-span-6 sm:col-span-4">
                        <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="customerName"
                          id="customerName"
                          value={formData.customerName}
                          onChange={handleChange}
                          className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                            errors.customerName ? 'border-red-300' : ''
                          }`}
                        />
                        {errors.customerName && (
                          <p className="mt-2 text-sm text-red-600 error-message">{errors.customerName}</p>
                        )}
                      </div>
                      
                      <div className="col-span-6 sm:col-span-4">
                        <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="customerEmail"
                          id="customerEmail"
                          value={formData.customerEmail}
                          onChange={handleChange}
                          className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                            errors.customerEmail ? 'border-red-300' : ''
                          }`}
                        />
                        {errors.customerEmail && (
                          <p className="mt-2 text-sm text-red-600 error-message">{errors.customerEmail}</p>
                        )}
                      </div>
                      
                      <div className="col-span-6 sm:col-span-4">
                        <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="customerPhone"
                          id="customerPhone"
                          value={formData.customerPhone}
                          onChange={handleChange}
                          className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                            errors.customerPhone ? 'border-red-300' : ''
                          }`}
                        />
                        {errors.customerPhone && (
                          <p className="mt-2 text-sm text-red-600 error-message">{errors.customerPhone}</p>
                        )}
                      </div>
                      
                      {/* Event details */}
                      <div className="col-span-6 border-t border-gray-200 pt-4">
                        <h4 className="text-md font-medium text-gray-900">Event Details</h4>
                      </div>
                      
                      <div className="col-span-6 sm:col-span-3">
                        <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700">
                          Event Date
                        </label>
                        <input
                          type="date"
                          name="eventDate"
                          id="eventDate"
                          min={getMinDate()}
                          value={formData.eventDate}
                          onChange={handleChange}
                          className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                            errors.eventDate ? 'border-red-300' : ''
                          }`}
                        />
                        {errors.eventDate && (
                          <p className="mt-2 text-sm text-red-600 error-message">{errors.eventDate}</p>
                        )}
                        {dateAvailability === false && !errors.eventDate && (
                          <p className="mt-2 text-sm text-red-600 error-message">This date is not available</p>
                        )}
                        {dateAvailability === true && (
                          <p className="mt-2 text-sm text-green-600">Date available</p>
                        )}
                      </div>
                      
                      <div className="col-span-6 sm:col-span-3">
                        <label htmlFor="eventTime" className="block text-sm font-medium text-gray-700">
                          Event Time
                        </label>
                        <input
                          type="time"
                          name="eventTime"
                          id="eventTime"
                          value={formData.eventTime}
                          onChange={handleChange}
                          className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                            errors.eventTime ? 'border-red-300' : ''
                          }`}
                        />
                        {errors.eventTime && (
                          <p className="mt-2 text-sm text-red-600 error-message">{errors.eventTime}</p>
                        )}
                      </div>
                      
                      <div className="col-span-6">
                        <label htmlFor="venue" className="block text-sm font-medium text-gray-700">
                          Venue Name
                        </label>
                        <input
                          type="text"
                          name="venue"
                          id="venue"
                          value={formData.venue}
                          onChange={handleChange}
                          placeholder="e.g., Grand Ballroom, Home, Office, etc."
                          className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                            errors.venue ? 'border-red-300' : ''
                          }`}
                        />
                        {errors.venue && (
                          <p className="mt-2 text-sm text-red-600 error-message">{errors.venue}</p>
                        )}
                      </div>
                      
                      <div className="col-span-6">
                        <label htmlFor="venueAddress" className="block text-sm font-medium text-gray-700">
                          Venue Address
                        </label>
                        <input
                          type="text"
                          name="venueAddress"
                          id="venueAddress"
                          value={formData.venueAddress}
                          onChange={handleChange}
                          placeholder="Full address including city, state and zip code"
                          className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                            errors.venueAddress ? 'border-red-300' : ''
                          }`}
                        />
                        {errors.venueAddress && (
                          <p className="mt-2 text-sm text-red-600 error-message">{errors.venueAddress}</p>
                        )}
                      </div>
                      
                      <div className="col-span-6">
                        <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700">
                          Special Instructions
                        </label>
                        <textarea
                          name="specialInstructions"
                          id="specialInstructions"
                          rows={3}
                          value={formData.specialInstructions}
                          onChange={handleChange}
                          placeholder="Any additional information about the venue, setup requirements, etc."
                          className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                      
                      {/* Payment method */}
                      <div className="col-span-6 border-t border-gray-200 pt-4">
                        <h4 className="text-md font-medium text-gray-900">Payment Method</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          A 50% deposit is required to confirm your booking.
                        </p>
                      </div>
                      
                      <div className="col-span-6">
                        <div className="space-y-4">
                          <div className="flex items-center">
                            <input
                              id="payment-credit-card"
                              name="paymentMethod"
                              type="radio"
                              value="credit_card"
                              checked={formData.paymentMethod === 'credit_card'}
                              onChange={handleChange}
                              className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                            />
                            <label htmlFor="payment-credit-card" className="ml-3 block text-sm font-medium text-gray-700">
                              Credit Card (Processed at confirmation)
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              id="payment-bank-transfer"
                              name="paymentMethod"
                              type="radio"
                              value="bank_transfer"
                              checked={formData.paymentMethod === 'bank_transfer'}
                              onChange={handleChange}
                              className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                            />
                            <label htmlFor="payment-bank-transfer" className="ml-3 block text-sm font-medium text-gray-700">
                              Bank Transfer (Details provided after booking)
                            </label>
                          </div>
                          <div className="flex items-center">
                            <input
                              id="payment-on-site"
                              name="paymentMethod"
                              type="radio"
                              value="on_site"
                              checked={formData.paymentMethod === 'on_site'}
                              onChange={handleChange}
                              className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300"
                            />
                            <label htmlFor="payment-on-site" className="ml-3 block text-sm font-medium text-gray-700">
                              Pay on Site (Cash or Card)
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      {/* Terms and conditions */}
                      <div className="col-span-6 border-t border-gray-200 pt-4">
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="agreeToTerms"
                              name="agreeToTerms"
                              type="checkbox"
                              checked={formData.agreeToTerms}
                              onChange={handleChange}
                              className={`focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded ${
                                errors.agreeToTerms ? 'border-red-300' : ''
                              }`}
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="agreeToTerms" className="font-medium text-gray-700">
                              I agree to the terms and conditions
                            </label>
                            <p className="text-gray-500">
                              By checking this box, you agree to our{' '}
                              <a href="#" className="text-primary-600 hover:text-primary-500">
                                Terms of Service
                              </a>{' '}
                              and{' '}
                              <a href="#" className="text-primary-600 hover:text-primary-500">
                                Privacy Policy
                              </a>
                              .
                            </p>
                            {errors.agreeToTerms && (
                              <p className="mt-2 text-sm text-red-600 error-message">{errors.agreeToTerms}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-between">
                    <Link
                      to={`/customer/${catererID}/quote`}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Back to Quote
                    </Link>
                    <button
                      type="submit"
                      disabled={isSubmitting || loading}
                      className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                        isSubmitting || loading
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                      }`}
                    >
                      {isSubmitting || loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        'Complete Booking'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm; 