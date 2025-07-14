import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Use the correct API URL format and ensure it's properly defined
const API_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5000/api';

// Add request throttling to prevent excessive API calls
let lastMenuFetchTime = 0;
let lastTimelineFetchTime = 0;
let lastProfileFetchTime = 0;
let lastOrdersFetchTime = 0;
let lastFeedbackFetchTime = 0;
let lastContactsFetchTime = 0;
const THROTTLE_DELAY = 0; // No delay for development

// Helper function to handle API errors
const handleApiError = (error) => {
  if (error.message === 'Network Error') {
    return 'Server connection failed. Please check if the server is running.';
  }
  return error.response?.data?.message || 'An unexpected error occurred';
};

// Helper function for throttling
const shouldThrottle = (lastTime) => {
  const now = Date.now();
  return (now - lastTime < THROTTLE_DELAY);
};

// Async thunks for caterer authentication and operations
export const loginCaterer = createAsyncThunk(
  'caterer/login',
  async (credentials, thunkApi) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, credentials);
      
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        return res.data;
      } else {
        return thunkApi.rejectWithValue(res.data.message || 'Login failed');
      }
    } catch (error) {
      return thunkApi.rejectWithValue(handleApiError(error));
    }
  }
);

export const registerCaterer = createAsyncThunk(
  'caterer/register',
  async (catererData, thunkApi) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, catererData);
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        return res.data;
      } else {
        return thunkApi.rejectWithValue(res.data.message || 'Registration failed');
      }
    } catch (error) {
      return thunkApi.rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchCatererProfile = createAsyncThunk(
  'caterer/fetchProfile',
  async (_, thunkApi) => {
    try {
      // Check if we should throttle this request
      if (shouldThrottle(lastProfileFetchTime)) {
        return thunkApi.rejectWithValue('Request throttled');
      }
      lastProfileFetchTime = Date.now();
      
      const token = localStorage.getItem("token");
      
      if (!token) {
        return thunkApi.rejectWithValue('No auth token');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const res = await axios.get(`${API_URL}/auth/me`, config);
      
      if (res.data.success) {
        return res.data;
      } else {
        return thunkApi.rejectWithValue(res.data.message || 'Failed to fetch profile');
      }
    } catch (error) {
      if (error.message === 'Request throttled') {
        // Don't show error for throttled requests
        return thunkApi.rejectWithValue('Request throttled');
      }
      
      // If token is invalid, clear it
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
      }
      
      return thunkApi.rejectWithValue(handleApiError(error));
    }
  }
);

export const updateCatererProfile = createAsyncThunk(
  'caterer/updateProfile',
  async (profileData, thunkApi) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return thunkApi.rejectWithValue('No auth token');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const res = await axios.put(`${API_URL}/caterer/profile`, profileData, config);
      if (res.data.success) {
        return res.data;
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || 'Failed to update profile'
      );
    }
  }
);

export const fetchMenuItems = createAsyncThunk(
  'caterer/fetchMenuItems',
  async (_, thunkApi) => {
    try {
      // Throttle API calls
      if (shouldThrottle(lastMenuFetchTime)) {
        return thunkApi.rejectWithValue('Request throttled');
      }
      lastMenuFetchTime = Date.now();
      
      const token = localStorage.getItem("token");
      if (!token) {
        return thunkApi.rejectWithValue('No auth token');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const res = await axios.get(`${API_URL}/menu`, config);
      if (res.data.success) {
        return res.data;
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      if (error.message === 'Request throttled') {
        // Don't show error for throttled requests
        return thunkApi.rejectWithValue('Request throttled');
      }
      return thunkApi.rejectWithValue(
        error.response?.data?.message || 'Failed to fetch menu items'
      );
    }
  }
);

export const addMenuItem = createAsyncThunk(
  'caterer/addMenuItem',
  async (menuItemData, thunkApi) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return thunkApi.rejectWithValue('No auth token');
      }

      let config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      // If not FormData, set Content-Type to JSON
      if (!(menuItemData instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
      } else {
        console.log('FormData detected, Content-Type will be set automatically');
      }

      const res = await axios.post(`${API_URL}/menu`, menuItemData, config);
      
      if (res.data.success) {
        return res.data;
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || 'Failed to add menu item'
      );
    }
  }
);

export const updateMenuItem = createAsyncThunk(
  'caterer/updateMenuItem',
  async ({ id, menuItemData }, thunkApi) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return thunkApi.rejectWithValue('No auth token');
      }

      let config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      // If not FormData, set Content-Type to JSON
      if (!(menuItemData instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
      }

      const res = await axios.put(`${API_URL}/menu/${id}`, menuItemData, config);
      if (res.data.success) {
        return res.data;
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || 'Failed to update menu item'
      );
    }
  }
);

export const deleteMenuItem = createAsyncThunk(
  'caterer/deleteMenuItem',
  async (id, thunkApi) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return thunkApi.rejectWithValue('No auth token');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const res = await axios.delete(`${API_URL}/menu/${id}`, config);
      if (res.data.success) {
        return { id };
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || 'Failed to delete menu item'
      );
    }
  }
);

export const fetchTimelineEvents = createAsyncThunk(
  'caterer/fetchTimelineEvents',
  async ({ view, date }, thunkApi) => {
    try {
      // Throttle API calls
      if (shouldThrottle(lastTimelineFetchTime)) {
        return thunkApi.rejectWithValue('Request throttled');
      }
      lastTimelineFetchTime = Date.now();
      
      const token = localStorage.getItem("token");
      if (!token) {
        return thunkApi.rejectWithValue('No auth token');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          view,
          date: date ? date.toISOString() : undefined
        }
      };

      const res = await axios.get(`${API_URL}/timeline`, config);
      if (res.data.success) {
        return res.data;
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      if (error.message === 'Request throttled') {
        // Don't show error for throttled requests
        return thunkApi.rejectWithValue('Request throttled');
      }
      return thunkApi.rejectWithValue(
        error.response?.data?.message || 'Failed to fetch timeline events'
      );
    }
  }
);

export const createTimelineEvent = createAsyncThunk(
  'caterer/createTimelineEvent',
  async (eventData, thunkApi) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return thunkApi.rejectWithValue('No auth token');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const res = await axios.post(`${API_URL}/timeline`, eventData, config);
      if (res.data.success) {
        return res.data;
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || 'Failed to create event'
      );
    }
  }
);

export const updateTimelineEvent = createAsyncThunk(
  'caterer/updateTimelineEvent',
  async ({ eventId, eventData }, thunkApi) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return thunkApi.rejectWithValue('No auth token');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const res = await axios.put(`${API_URL}/timeline/${eventId}`, eventData, config);
      if (res.data.success) {
        return res.data;
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || 'Failed to update event'
      );
    }
  }
);

export const deleteTimelineEvent = createAsyncThunk(
  'caterer/deleteTimelineEvent',
  async (eventId, thunkApi) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return thunkApi.rejectWithValue('No auth token');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const res = await axios.delete(`${API_URL}/timeline/${eventId}`, config);
      if (res.data.success) {
        return { eventId };
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || 'Failed to delete event'
      );
    }
  }
);

// New thunks for orders, feedback, and contacts

export const fetchOrders = createAsyncThunk(
  'caterer/fetchOrders',
  async (_, thunkApi) => {
    try {
      // Throttle API calls
      if (shouldThrottle(lastOrdersFetchTime)) {
        return thunkApi.rejectWithValue('Request throttled');
      }
      lastOrdersFetchTime = Date.now();
      
      const token = localStorage.getItem("token");
      if (!token) {
        return thunkApi.rejectWithValue('No auth token');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const res = await axios.get(`${API_URL}/caterer/orders`, config);
      if (res.data.success) {
        return res.data;
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      if (error.message === 'Request throttled') {
        // Don't show error for throttled requests
        return thunkApi.rejectWithValue('Request throttled');
      }
      return thunkApi.rejectWithValue(
        error.response?.data?.message || 'Failed to fetch orders'
      );
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'caterer/updateOrderStatus',
  async ({ orderId, status, note }, thunkApi) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return thunkApi.rejectWithValue('No auth token');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const res = await axios.put(`${API_URL}/caterer/orders/${orderId}/status`, { 
        status, 
        note 
      }, config);
      
      if (res.data.success) {
        return res.data;
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || 'Failed to update order status'
      );
    }
  }
);

export const fetchFeedback = createAsyncThunk(
  'caterer/fetchFeedback',
  async (_, thunkApi) => {
    try {
      // Throttle API calls
      if (shouldThrottle(lastFeedbackFetchTime)) {
        return thunkApi.rejectWithValue('Request throttled');
      }
      lastFeedbackFetchTime = Date.now();
      
      const token = localStorage.getItem("token");
      if (!token) {
        return thunkApi.rejectWithValue('No auth token');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const res = await axios.get(`${API_URL}/caterer/feedback`, config);
      if (res.data.success) {
        return res.data;
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      if (error.message === 'Request throttled') {
        // Don't show error for throttled requests
        return thunkApi.rejectWithValue('Request throttled');
      }
      return thunkApi.rejectWithValue(
        error.response?.data?.message || 'Failed to fetch feedback'
      );
    }
  }
);

export const markFeedbackAsRead = createAsyncThunk(
  'caterer/markFeedbackAsRead',
  async (feedbackId, thunkApi) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return thunkApi.rejectWithValue('No auth token');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const res = await axios.put(`${API_URL}/caterer/feedback/${feedbackId}/read`, {}, config);
      if (res.data.success) {
        return { feedbackId, ...res.data };
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || 'Failed to mark feedback as read'
      );
    }
  }
);

export const fetchContacts = createAsyncThunk(
  'caterer/fetchContacts',
  async (_, thunkApi) => {
    try {
      // Throttle API calls
      if (shouldThrottle(lastContactsFetchTime)) {
        return thunkApi.rejectWithValue('Request throttled');
      }
      lastContactsFetchTime = Date.now();
      
      const token = localStorage.getItem("token");
      if (!token) {
        return thunkApi.rejectWithValue('No auth token');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      const res = await axios.get(`${API_URL}/caterer/contacts`, config);
      if (res.data.success) {
        return res.data;
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      if (error.message === 'Request throttled') {
        // Don't show error for throttled requests
        return thunkApi.rejectWithValue('Request throttled');
      }
      return thunkApi.rejectWithValue(
        error.response?.data?.message || 'Failed to fetch contacts'
      );
    }
  }
);

export const markContactAsResolved = createAsyncThunk(
  'caterer/markContactAsResolved',
  async (contactId, thunkApi) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return thunkApi.rejectWithValue('No auth token');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const res = await axios.put(`${API_URL}/caterer/contacts/${contactId}/resolve`, {}, config);
      if (res.data.success) {
        return { contactId, ...res.data };
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || 'Failed to mark contact as resolved'
      );
    }
  }
);

// CATEGORY THUNKS
export const fetchCategories = createAsyncThunk(
  'caterer/fetchCategories',
  async (_, thunkApi) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return thunkApi.rejectWithValue('No auth token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${API_URL}/menu/categories`, config);
      if (res.data.success) return res.data.categories;
      return thunkApi.rejectWithValue(res.data.message || 'Failed to fetch categories');
    } catch (error) {
      return thunkApi.rejectWithValue(handleApiError(error));
    }
  }
);

export const addCategory = createAsyncThunk(
  'caterer/addCategory',
  async (name, thunkApi) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return thunkApi.rejectWithValue('No auth token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post(`${API_URL}/menu/categories`, { name }, config);
      if (res.data.success) return res.data.category;
      return thunkApi.rejectWithValue(res.data.message || 'Failed to add category');
    } catch (error) {
      return thunkApi.rejectWithValue(handleApiError(error));
    }
  }
);

// Caterer slice
const catererSlice = createSlice({
  name: 'caterer',
  initialState: {
    isAuthenticated: false,
    catererInfo: null,
    menuItems: [],
    events: [],
    orders: [],
    feedback: [],
    contacts: [],
    currentView: 'week',
    selectedDate: new Date(),
    loading: false,
    error: null,
    authChecked: false,
    categories: [],
    categoriesLoading: false,
    categoriesError: null
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.isAuthenticated = false;
      state.catererInfo = null;
      state.menuItems = [];
      state.events = [];
      state.orders = [];
      state.feedback = [];
      state.contacts = [];
      state.loading = false;
      state.error = null;
      state.authChecked = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentView: (state, action) => {
      state.currentView = action.payload;
    },
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginCaterer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginCaterer.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.catererInfo = action.payload.caterer;
        state.error = null;
      })
      .addCase(loginCaterer.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.catererInfo = null;
        state.error = action.payload;
      })
      
      // Registration
      .addCase(registerCaterer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerCaterer.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.catererInfo = action.payload.caterer;
        state.error = null;
      })
      .addCase(registerCaterer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Profile
      .addCase(fetchCatererProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.authChecked = false;
      })
      .addCase(fetchCatererProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.catererInfo = action.payload.caterer;
        state.error = null;
        state.authChecked = true;
      })
      .addCase(fetchCatererProfile.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.catererInfo = null;
        state.error = action.payload;
        state.authChecked = true;
      })
      
      // Update Profile
      .addCase(updateCatererProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCatererProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.catererInfo = action.payload.data;
        state.error = null;
      })
      .addCase(updateCatererProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Menu Items
      .addCase(fetchMenuItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.loading = false;
        state.menuItems = action.payload.data;
        state.error = null;
      })
      .addCase(fetchMenuItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add Menu Item
      .addCase(addMenuItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMenuItem.fulfilled, (state, action) => {
        state.loading = false;
        state.menuItems.push(action.payload.data);
        state.error = null;
      })
      .addCase(addMenuItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Menu Item
      .addCase(updateMenuItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        state.loading = false;
        state.menuItems = state.menuItems.map(item => 
          item._id === action.payload.data._id ? action.payload.data : item
        );
        state.error = null;
      })
      .addCase(updateMenuItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete Menu Item
      .addCase(deleteMenuItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.loading = false;
        state.menuItems = state.menuItems.filter(item => item._id !== action.payload.id);
        state.error = null;
      })
      .addCase(deleteMenuItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Timeline Events
      .addCase(fetchTimelineEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimelineEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.events;
        state.currentView = action.payload.view;
        state.selectedDate = new Date(action.payload.date);
        state.error = null;
      })
      .addCase(fetchTimelineEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create Timeline Event
      .addCase(createTimelineEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTimelineEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.events.push(action.payload.event);
        state.error = null;
      })
      .addCase(createTimelineEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Timeline Event
      .addCase(updateTimelineEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTimelineEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.events = state.events.map(event => 
          event.eventId === action.payload.event.eventId ? action.payload.event : event
        );
        state.error = null;
      })
      .addCase(updateTimelineEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete Timeline Event
      .addCase(deleteTimelineEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTimelineEvent.fulfilled, (state, action) => {
        state.loading = false;
        state.events = state.events.filter(event => event.eventId !== action.payload.eventId);
        state.error = null;
      })
      .addCase(deleteTimelineEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Orders
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.orders;
        state.error = null;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        if (action.payload !== 'Request throttled') {
          state.error = action.payload;
        }
      })
      
      // Update Order Status
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = state.orders.map(order => 
          order._id === action.payload.order._id ? action.payload.order : order
        );
        state.error = null;
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Feedback
      .addCase(fetchFeedback.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeedback.fulfilled, (state, action) => {
        state.loading = false;
        state.feedback = action.payload.feedback;
        state.error = null;
      })
      .addCase(fetchFeedback.rejected, (state, action) => {
        state.loading = false;
        if (action.payload !== 'Request throttled') {
          state.error = action.payload;
        }
      })
      
      // Mark Feedback as Read
      .addCase(markFeedbackAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markFeedbackAsRead.fulfilled, (state, action) => {
        state.loading = false;
        state.feedback = state.feedback.map(item => 
          item._id === action.payload.feedbackId ? { ...item, read: true } : item
        );
        state.error = null;
      })
      .addCase(markFeedbackAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Contacts
      .addCase(fetchContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts = action.payload.contacts;
        state.error = null;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.loading = false;
        if (action.payload !== 'Request throttled') {
          state.error = action.payload;
        }
      })
      
      // Mark Contact as Resolved
      .addCase(markContactAsResolved.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markContactAsResolved.fulfilled, (state, action) => {
        state.loading = false;
        state.contacts = state.contacts.map(contact => 
          contact._id === action.payload.contactId ? { ...contact, resolved: true } : contact
        );
        state.error = null;
      })
      .addCase(markContactAsResolved.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError = action.payload;
      })
      
      // Add Category
      .addCase(addCategory.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories.push(action.payload);
      })
      .addCase(addCategory.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError = action.payload;
      });
  }
});

export const { logout, clearError, setCurrentView, setSelectedDate } = catererSlice.actions;
export default catererSlice.reducer; 
