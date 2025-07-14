import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const CatererContext = createContext();

export const CatererProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [catererInfo, setCatererInfo] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        const res = await axios.get(`${API_URL}/auth/me`, config);
        
        if (res.data.success) {
          setIsAuthenticated(true);
          setCatererInfo(res.data.caterer);
        } else {
          setIsAuthenticated(false);
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [API_URL]);
  
  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setIsAuthenticated(true);
        setCatererInfo(res.data.caterer);
        return true;
      } else {
        setError('Login failed');
        return false;
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setCatererInfo(null);
    setMenuItems([]);
  };
  
  // Fetch menu items
  const fetchMenuItems = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const res = await axios.get(`${API_URL}/menu`, config);
      
      if (res.data.success) {
        setMenuItems(res.data.data);
      }
    } catch (error) {
      setError('Failed to fetch menu items');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Add a menu item
  const addMenuItem = async (menuItemData) => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const res = await axios.post(`${API_URL}/menu`, menuItemData, config);
      
      if (res.data.success) {
        setMenuItems([...menuItems, res.data.data]);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      setError('Failed to add menu item');
      console.error(error);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Update a menu item
  const updateMenuItem = async (id, menuItemData) => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const res = await axios.put(`${API_URL}/menu/${id}`, menuItemData, config);
      
      if (res.data.success) {
        setMenuItems(menuItems.map(item => item._id === id ? res.data.data : item));
        return true;
      } else {
        return false;
      }
    } catch (error) {
      setError('Failed to update menu item');
      console.error(error);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a menu item
  const deleteMenuItem = async (id) => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const res = await axios.delete(`${API_URL}/menu/${id}`, config);
      
      if (res.data.success) {
        setMenuItems(menuItems.filter(item => item._id !== id));
        return true;
      } else {
        return false;
      }
    } catch (error) {
      setError('Failed to delete menu item');
      console.error(error);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Update caterer profile
  const updateProfile = async (profileData) => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const res = await axios.put(`${API_URL}/caterer/profile`, profileData, config);
      
      if (res.data.success) {
        setCatererInfo(res.data.data);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      setError('Failed to update profile');
      console.error(error);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <CatererContext.Provider value={{
      isAuthenticated,
      catererInfo,
      menuItems,
      loading,
      error,
      login,
      logout,
      fetchMenuItems,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      updateProfile
    }}>
      {children}
    </CatererContext.Provider>
  );
}; 