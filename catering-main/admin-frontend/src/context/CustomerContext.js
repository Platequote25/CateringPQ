import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

export const CustomerContext = createContext();

export const CustomerProvider = ({ children }) => {
  const { catererID } = useParams();
  const [catererInfo, setCatererInfo] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [guestCount, setGuestCount] = useState(0);
  const [currentCategory, setCurrentCategory] = useState('starters');
  const [totalCost, setTotalCost] = useState(0);
  const [perPlateCost, setPerPlateCost] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  // Fetch caterer info and menu on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        const res = await axios.get(`${API_URL}/customer/${catererID}/menu`);
        
        if (res.data.success) {
          setCatererInfo(res.data.caterer);
          setMenuItems(res.data.menu);
          
          // Extract unique categories from menu items
          const uniqueCategories = [...new Set(res.data.menu.map(item => item.category))];
          setCategories(uniqueCategories);
          
          // Set default category if available
          if (uniqueCategories.length > 0) {
            setCurrentCategory(uniqueCategories[0]);
          }
        }
      } catch (error) {
        setError('Failed to fetch menu');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    if (catererID) {
      fetchData();
    }
  }, [catererID, API_URL]);
  
  // Calculate quote when selected items or guest count changes
  useEffect(() => {
    const calculateQuote = async () => {
      if (selectedItems.length === 0 || guestCount === 0) {
        setTotalCost(0);
        setPerPlateCost(0);
        setDiscount(0);
        return;
      }
      
      try {
        const res = await axios.post(`${API_URL}/customer/${catererID}/quote`, {
          selectedItems,
          guestCount
        });
        
        if (res.data.success) {
          const quote = res.data.quote;
          setTotalCost(quote.totalCost);
          setPerPlateCost(quote.perPlateCost);
          setDiscount(quote.discountPercent);
        }
      } catch (error) {
        setError('Failed to calculate quote');
        console.error(error);
      }
    };
    
    calculateQuote();
  }, [selectedItems, guestCount, catererID, API_URL]);
  
  // Add item to selection
  const addItem = (item) => {
    const existingItem = selectedItems.find(i => i.itemId === item._id);
    
    if (existingItem) {
      setSelectedItems(
        selectedItems.map(i => 
          i.itemId === item._id 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        )
      );
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          itemId: item._id,
          name: item.name,
          price: item.price,
          quantity: 1
        }
      ]);
    }
  };
  
  // Remove item from selection
  const removeItem = (itemId) => {
    const existingItem = selectedItems.find(i => i.itemId === itemId);
    
    if (existingItem && existingItem.quantity > 1) {
      setSelectedItems(
        selectedItems.map(i => 
          i.itemId === itemId 
            ? { ...i, quantity: i.quantity - 1 } 
            : i
        )
      );
    } else {
      setSelectedItems(selectedItems.filter(i => i.itemId !== itemId));
    }
  };
  
  // Clear all selected items
  const clearSelection = () => {
    setSelectedItems([]);
  };
  
  // Update guest count
  const updateGuestCount = (count) => {
    setGuestCount(Math.max(0, count));
  };
  
  return (
    <CustomerContext.Provider value={{
      catererInfo,
      menuItems,
      categories,
      selectedItems,
      guestCount,
      currentCategory,
      totalCost,
      perPlateCost,
      discount,
      loading,
      error,
      setCurrentCategory,
      addItem,
      removeItem,
      clearSelection,
      updateGuestCount
    }}>
      {children}
    </CustomerContext.Provider>
  );
}; 