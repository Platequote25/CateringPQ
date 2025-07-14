import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { CustomerOrderProvider, useCustomerOrderContext } from '../../context/CustomerOrderContext';
import GuestCountPage from './GuestCountPage';
import UnifiedMenuPage from './UnifiedMenuPage';
import OrderSummaryPage from './OrderSummaryPage';
import OrderConfirmationPage from './OrderConfirmationPage';
import CustomerDetailsForm from './CustomerDetailsForm';
import './orderFlow.css';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCatererInfo } from '../../redux/slices/customerSlice';

const steps = [
  'guestCount',
  'customerDetails',
  'unifiedMenu',
  'orderSummary',
  'orderConfirmation',
];

function OrderFlowInner() {
  const { catererID: catererIDFromUrl } = useParams();
  const useStickyState = (defaultValue, key) => {
    const [value, setValue] = useState(() => {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    });
    useEffect(() => {
      window.localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);
    return [value, setValue];
  };

  const [step, setStep] = useStickyState(0, 'orderflow_step');
  const [selectedItems, setSelectedItems] = useStickyState([], 'orderflow_selectedItems');
  const [orderSummary, setOrderSummary] = useState(null);
  const [orderConfirmation, setOrderConfirmation] = useState(null);
  const { guestCount, setGuestCount, catererID, setCatererID } = useCustomerOrderContext();
  const dispatch = useDispatch();
  const catererInfo = useSelector(state => state.customer.catererInfo);
  const [quote, setQuote] = useState(null);
  const [customerDetails, setCustomerDetails] = useStickyState({}, 'orderflow_customerDetails');

  useEffect(() => {
    if (catererIDFromUrl) {
      setCatererID(catererIDFromUrl);
      dispatch(fetchCatererInfo(catererIDFromUrl));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catererIDFromUrl, dispatch]);

  useEffect(() => {
    if (catererInfo) {
      // No miscCost state to set here
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catererInfo]);

  // Fetch quote when entering orderSummary step
  useEffect(() => {
    if (step === 2 && selectedItems.length > 0 && guestCount > 0 && catererID) {
      (async () => {
        try {
          const resp = await fetch(`/api/customer/${catererID}/quote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selectedItems: selectedItems.map(item => ({ itemId: item._id, quantity: item.quantity })), guestCount }),
          });
          const data = await resp.json();
          if (data.success) {
            setQuote(data.quote);
          } else {
            setQuote(null);
          }
        } catch (err) {
          setQuote(null);
        }
      })();
    }
  }, [step, selectedItems, guestCount, catererID]);

  const handleStartNewOrder = () => {
    // Clear persisted data for a clean slate on next order
    localStorage.removeItem('orderflow_step');
    localStorage.removeItem('orderflow_selectedItems');
    localStorage.removeItem('orderflow_miscCost');
    localStorage.removeItem('order_guestCount');
    localStorage.removeItem('orderflow_allSelectedItems');
    localStorage.removeItem('orderflow_menuType');
    localStorage.removeItem('orderflow_category');
    localStorage.removeItem('orderflow_customerDetails');
    // We keep 'order_catererID' since we are in the same caterer's flow

    // Also reset the state for the current session
    setStep(0);
    setSelectedItems([]);
    setGuestCount('');
    setOrderSummary(null);
    setOrderConfirmation(null);
    setCustomerDetails({});
  };

  // This effect will trigger navigation ONLY when the order is successfully confirmed.
  useEffect(() => {
    if (orderConfirmation && orderConfirmation.success) {
      goNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderConfirmation]);

  const goNext = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleItemsSelected = (items) => {
    setSelectedItems(items);
    goNext();
  };

  // Handler to reset menu items when guest count changes
  const handleGuestCountChange = (newCount) => {
    setGuestCount(newCount);
    // setSelectedItems([]); // Removed to persist cart items
  };

  const handleCustomerDetailsSubmit = (details) => {
    setCustomerDetails(details);
    goNext();
  };

  const handleCustomerDetailsBack = () => {
    goBack();
  };

  const handleConfirmOrder = async () => {
    if (selectedItems.length === 0) {
      return;
    }
    // Fetch quote from backend to get correct totalCost (with discount)
    let quoteResp;
    try {
      quoteResp = await fetch(`/api/customer/${catererID}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedItems: selectedItems.map(item => ({ itemId: item._id, quantity: item.quantity })), guestCount }),
      });
    } catch (err) {
      console.error('Failed to fetch quote:', err);
      return;
    }
    const quoteData = await quoteResp.json();
    if (!quoteData.success) {
      console.error('Quote error:', quoteData.message);
      return;
    }
    const { totalCost, discountAmount, discountPercent, subtotal } = quoteData.quote;
    const misc = Number(catererInfo?.miscCost) || 0;
    const finalTotal = Number(totalCost) + misc;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/customer/${catererID}/booking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerInfo: {
            name: customerDetails.name,
            email: customerDetails.email,
            phone: customerDetails.phone,
          },
          eventDetails: {
            eventName: customerDetails.eventName && customerDetails.eventName.trim() !== '' ? customerDetails.eventName : '-',
            date: customerDetails.eventDate,
            time: customerDetails.eventTime,
            guestCount,
          },
          selectedItems: selectedItems.map(item => ({ itemId: item._id, quantity: item.quantity })),
          pricing: { subtotal, discount: discountAmount, total: finalTotal, miscCost: misc },
        }),
      });
      const result = await res.json();
      if (result.success) {
        setOrderSummary({ guestCount, items: selectedItems, misc, subtotal, discount: discountAmount, total: finalTotal, customerDetails: { ...customerDetails, eventName: customerDetails.eventName && customerDetails.eventName.trim() !== '' ? customerDetails.eventName : '-' } });
        setOrderConfirmation(result);
      } else {
        // Handle error
        console.error(result.message || 'Failed to submit order.');
      }
    } catch (err) {
      console.error('An unexpected error occurred.');
    }
  };

  const CurrentComponent = () => {
    const pageKey = `${steps[step]}-${step}`;
    switch (steps[step]) {
      case 'guestCount':
        return <GuestCountPage key={pageKey} guestCount={guestCount} setGuestCount={handleGuestCountChange} goNext={goNext} />;
      case 'customerDetails':
        return <CustomerDetailsForm key={pageKey} initialDetails={customerDetails} onSubmit={handleCustomerDetailsSubmit} goBack={handleCustomerDetailsBack} />;
      case 'unifiedMenu':
        return <UnifiedMenuPage key={pageKey} guestCount={guestCount} setGuestCount={handleGuestCountChange} onItemsSelected={handleItemsSelected} goBack={goBack} miscCost={Number(catererInfo?.miscCost) || 0} />;
      case 'orderSummary': {
        const misc = Number(catererInfo?.miscCost) || 0;
        const dynamicPricing = catererInfo?.dynamicPricing || [];
        return <OrderSummaryPage key={pageKey} guestCount={guestCount} items={selectedItems} goNext={handleConfirmOrder} goBack={goBack} dynamicPricing={dynamicPricing} misc={misc} customerDetails={customerDetails} />;
      }
      case 'orderConfirmation':
        return <OrderConfirmationPage key={pageKey} orderSummary={orderSummary} orderConfirmation={orderConfirmation} goBack={goBack} onStartNewOrder={handleStartNewOrder} dynamicPricing={catererInfo?.dynamicPricing || []} misc={Number(quote?.miscCost) || 0} />;
      default:
        return null;
    }
  };

  return (
    <div className="orderflow-page-container">
      <div className="orderflow-content">
        <CurrentComponent />
      </div>
    </div>
  );
}

export default function OrderFlow() {
  return (
    <CustomerOrderProvider>
      <OrderFlowInner />
    </CustomerOrderProvider>
  );
} 
