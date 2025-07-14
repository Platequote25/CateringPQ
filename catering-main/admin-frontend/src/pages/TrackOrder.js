import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getBookingDetails } from '../redux/slices/customerSlice';
import { toast } from 'react-toastify';

const TrackOrder = () => {
  const { catererID, orderId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { booking, loading, error } = useSelector(state => state.customer);
  
  // Local state for tracking status
  const [currentStep, setCurrentStep] = useState(0);
  const [orderIdInput, setOrderIdInput] = useState('');
  
  // Fetch booking details if orderId is provided
  useEffect(() => {
    if (catererID && orderId) {
      dispatch(getBookingDetails({ catererID, bookingId: orderId }))
        .unwrap()
        .catch(err => {
          toast.error(err || 'Failed to fetch booking details');
        });
    }
  }, [catererID, orderId, dispatch]);
  
  // Set current step based on booking status
  useEffect(() => {
    if (booking) {
      const status = booking.status?.toLowerCase() || '';
      
      if (status === 'confirmed') {
        setCurrentStep(1);
      } else if (status === 'in preparation') {
        setCurrentStep(2);
      } else if (status === 'ready for delivery' || status === 'ready for pickup') {
        setCurrentStep(3);
      } else if (status === 'in transit' || status === 'on the way') {
        setCurrentStep(4);
      } else if (status === 'delivered' || status === 'completed') {
        setCurrentStep(5);
      } else {
        setCurrentStep(0);
      }
    }
  }, [booking]);
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (orderIdInput.trim()) {
      navigate(`/customer/${catererID}/track/${orderIdInput.trim()}`);
    } else {
      toast.error('Please enter a valid Order ID');
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Not specified';
      
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString(undefined, options);
    } catch (error) {
      return 'Not specified';
    }
  };
  
  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return timeString;
    }
  };
  
  // Get status text and color
  const getStatusDetails = (status) => {
    const statusMap = {
      'pending': { text: 'Pending Confirmation', color: 'yellow' },
      'confirmed': { text: 'Confirmed', color: 'green' },
      'in preparation': { text: 'In Preparation', color: 'blue' },
      'ready for delivery': { text: 'Ready for Delivery', color: 'blue' },
      'ready for pickup': { text: 'Ready for Pickup', color: 'blue' },
      'in transit': { text: 'In Transit', color: 'blue' },
      'on the way': { text: 'On The Way', color: 'blue' },
      'delivered': { text: 'Delivered', color: 'green' },
      'completed': { text: 'Completed', color: 'green' },
      'cancelled': { text: 'Cancelled', color: 'red' }
    };
    
    const lowerStatus = (status || '').toLowerCase();
    return statusMap[lowerStatus] || { text: 'Unknown', color: 'gray' };
  };
  
  // Define tracking steps based on order status
  const getTrackingSteps = () => {
    // Simple tracking steps without numbers
    return [
    { title: 'Order Placed', description: 'Your order has been received' },
    { title: 'Order Confirmed', description: 'Your order has been confirmed' },
    { title: 'In Preparation', description: 'Your order is being prepared' },
      { title: 'Ready for Delivery', description: 'Your order is ready to be delivered' },
      { title: 'Completed', description: 'Your order has been delivered' }
  ];
  };
  
  const trackingSteps = getTrackingSteps();
  
  // If no orderId is provided, show the form to enter an order ID
  if (!orderId) {
    return (
      <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Track Your Order</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Enter your order ID to track the status of your order.</p>
            </div>
            <form className="mt-5 sm:flex sm:items-center" onSubmit={handleSubmit}>
              <div className="w-full sm:max-w-xs">
                <label htmlFor="orderId" className="sr-only">Order ID</label>
                <input
                  type="text"
                  name="orderId"
                  id="orderId"
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter Order ID"
                  value={orderIdInput}
                  onChange={(e) => setOrderIdInput(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Track Order
              </button>
            </form>
            <div className="mt-6">
              <p className="text-sm text-gray-500">
                Don't have your order ID? Please check your email confirmation or contact us for assistance.
              </p>
              <div className="mt-4">
                <Link
                  to={`/customer/${catererID}/contact`}
                  className="text-primary-600 hover:text-primary-500 font-medium"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Loading order details...</p>
      </div>
    );
  }
  
  if (error || !booking) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Order Not Found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The order you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <div className="mt-6">
            <Link
              to={`/customer/${catererID}/track`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  const statusDetails = getStatusDetails(booking.status);
  
  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            {/* Order Header */}
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Order Tracking</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Order ID: {booking.orderNumber || booking.bookingId}
                </p>
              </div>
              <div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusDetails.color}-100 text-${statusDetails.color}-800`}>
                  {statusDetails.text}
                </span>
              </div>
            </div>
            
            {/* Order Timeline */}
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <h4 className="text-base font-medium text-gray-900 mb-4">Order Status</h4>
              
              <div className="flow-root">
                <ul className="relative">
                  {trackingSteps.map((step, index) => {
                    const isActive = index <= currentStep;
                    const isCurrent = index === currentStep;
                    
                    return (
                      <li key={index} className={`relative pb-8 ${index === trackingSteps.length - 1 ? '' : 'border-l border-gray-200 ml-4'}`}>
                        <div className={`absolute -left-4 top-0 flex items-center justify-center w-8 h-8 rounded-full ${
                          isActive ? 'bg-primary-600' : 'bg-gray-200'
                        }`}>
                          {isActive ? (
                            <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="ml-8">
                          <h5 className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                            {step.title}
                            {isCurrent && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                Current
                              </span>
                            )}
                          </h5>
                          <p className="mt-1 text-sm text-gray-500">{step.description}</p>
                          {isCurrent && booking.estimatedDeliveryTime && (
                            <p className="mt-1 text-sm text-primary-600">
                              Estimated delivery time: {formatTime(booking.estimatedDeliveryTime)}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            
            {/* Order Details */}
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <h4 className="text-base font-medium text-gray-900 mb-4">Order Details</h4>
              
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Event Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(booking.event?.date || booking.eventDate)}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Event Time</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatTime(booking.event?.time || booking.eventTime) || 'Not specified'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Venue</dt>
                  <dd className="mt-1 text-sm text-gray-900">{booking.event?.location || booking.venue || 'Not specified'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Guest Count</dt>
                  <dd className="mt-1 text-sm text-gray-900">{booking.event?.guestCount || booking.guestCount || 'Not specified'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Order Items</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {booking.items && booking.items.length > 0 ? (
                      <ul className="divide-y divide-gray-200">
                        {booking.items.map((item, index) => (
                          <li key={index} className="py-2 flex justify-between">
                            <span>{item.name} x {item.quantity}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      'No items'
                    )}
                  </dd>
                </div>
                
                {(booking.specialRequests || booking.specialInstructions) && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Special Instructions</dt>
                    <dd className="mt-1 text-sm text-gray-900">{booking.specialRequests || booking.specialInstructions}</dd>
                  </div>
                )}
              </dl>
            </div>
            
            {/* Contact Information */}
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <h4 className="text-base font-medium text-gray-900 mb-4">Need Help?</h4>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to={`/customer/${catererID}/contact`}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Support
                </Link>
                
                {booking.status !== 'cancelled' && booking.status !== 'completed' && booking.status !== 'delivered' && (
                  <button
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    onClick={() => {
                      // Handle cancel request
                      toast.info('Your cancellation request has been sent. We will contact you shortly.');
                    }}
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Request Cancellation
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder; 