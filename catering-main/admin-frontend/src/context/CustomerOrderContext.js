import React, { createContext, useContext, useState, useEffect } from 'react';

const CustomerOrderContext = createContext();

export function CustomerOrderProvider({ children }) {
  // Load from localStorage if available
  const [catererID, setCatererIDState] = useState(() => localStorage.getItem('order_catererID') || '');
  const [guestCount, setGuestCountState] = useState(() => localStorage.getItem('order_guestCount') || '');

  // Sync to localStorage on change
  useEffect(() => {
    localStorage.setItem('order_catererID', catererID);
  }, [catererID]);

  useEffect(() => {
    localStorage.setItem('order_guestCount', guestCount);
  }, [guestCount]);

  // Wrapped setters to keep state and localStorage in sync
  const setCatererID = (id) => setCatererIDState(id);
  const setGuestCount = (count) => setGuestCountState(count);

  return (
    <CustomerOrderContext.Provider value={{
      catererID, setCatererID,
      guestCount, setGuestCount,
      // Add more here
    }}>
      {children}
    </CustomerOrderContext.Provider>
  );
}

export function useCustomerOrderContext() {
  return useContext(CustomerOrderContext);
} 