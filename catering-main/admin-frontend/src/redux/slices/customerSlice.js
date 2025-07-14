import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://localhost:5000/api';


// Add request throttling
let lastMenuFetchTime = 0;
let lastQuoteCalcTime = 0;
let lastInfoFetchTime = 0;
let lastAvailabilityCheckTime = 0;
let lastBookingSubmitTime = 0;
let lastFeedbackSubmitTime = 0;
const THROTTLE_DELAY = 3000; // 3 seconds

// Helper function for throttling
const shouldThrottle = (lastTime) => {
  const now = Date.now();
  return (now - lastTime < THROTTLE_DELAY);
};

// Helper function to handle API errors
const handleApiError = (error) => {
  if (error.message === 'Network Error') {
    return 'Server connection failed. Please check if the server is running.';
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  return 'An unexpected error occurred';
};

// Async thunks for customer operations
export const fetchCatererInfo = createAsyncThunk(
  'customer/fetchCatererInfo',
  async (catererID, thunkApi) => {
    try {
      // Throttle API calls
      if (shouldThrottle(lastInfoFetchTime)) {
        return thunkApi.rejectWithValue('Request throttled');
      }
      lastInfoFetchTime = Date.now();
      
      const res = await axios.get(`${API_URL}/customer/${catererID}/info`);
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
      return thunkApi.rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchCatererMenu = createAsyncThunk(
  'customer/fetchCatererMenu',
  async ({ catererID, filters = {} }, thunkApi) => {
    try {
      // Throttle API calls
      if (shouldThrottle(lastMenuFetchTime)) {
        return thunkApi.rejectWithValue('Request throttled');
      }
      lastMenuFetchTime = Date.now();
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const res = await axios.get(`${API_URL}/customer/${catererID}/menu${queryString}`);
      
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
      return thunkApi.rejectWithValue(handleApiError(error));
    }
  }
);

export const fetchPopularMenuItems = createAsyncThunk(
  'customer/fetchPopularMenuItems',
  async (catererID, thunkApi) => {
    try {
      // Throttle API calls
      if (shouldThrottle(lastMenuFetchTime)) {
        return thunkApi.rejectWithValue('Request throttled');
      }
      lastMenuFetchTime = Date.now();
      
      const res = await axios.get(`${API_URL}/customer/${catererID}/menu/popular`);
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
      return thunkApi.rejectWithValue(handleApiError(error));
    }
  }
);

export const calculateQuote = createAsyncThunk(
  'customer/calculateQuote',
  async ({ catererID, quoteData }, thunkApi) => {
    try {
      // Throttle API calls
      if (shouldThrottle(lastQuoteCalcTime)) {
        return thunkApi.rejectWithValue('Request throttled');
      }
      lastQuoteCalcTime = Date.now();
      
      const res = await axios.post(`${API_URL}/customer/${catererID}/quote`, quoteData);
      if (res.data.success) {
        // Return the response data with the additional eventDate and requirements
        return {
          ...res.data,
          eventDate: quoteData.eventDate,
          specialRequirements: quoteData.specialRequirements,
          dietaryRestrictions: quoteData.dietaryRestrictions
        };
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      if (error.message === 'Request throttled') {
        // Don't show error for throttled requests
        return thunkApi.rejectWithValue('Request throttled');
      }
      
      return thunkApi.rejectWithValue(handleApiError(error));
    }
  }
);

export const checkDateAvailability = createAsyncThunk(
  'customer/checkDateAvailability',
  async ({ catererID, date }, thunkApi) => {
    try {
      // Throttle API calls
      if (shouldThrottle(lastAvailabilityCheckTime)) {
        return thunkApi.rejectWithValue('Request throttled');
      }
      lastAvailabilityCheckTime = Date.now();
      
      const res = await axios.get(`${API_URL}/customer/${catererID}/availability`, {
        params: { date }
      });
      
      if (res.data.success) {
        return res.data;
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      if (error.message === 'Request throttled') {
        return thunkApi.rejectWithValue('Request throttled');
      }
      return thunkApi.rejectWithValue(handleApiError(error));
    }
  }
);

export const submitBooking = createAsyncThunk(
  'customer/submitBooking',
  async ({ catererID, bookingData }, thunkApi) => {
    try {
      // Throttle API calls
      if (shouldThrottle(lastBookingSubmitTime)) {
        return thunkApi.rejectWithValue('Request throttled');
      }
      lastBookingSubmitTime = Date.now();
      
      // Format the booking data to match the server's expected structure
      const formattedBookingData = {
        quoteId: bookingData.quoteId,
        customerInfo: {
          name: bookingData.customerName,
          email: bookingData.customerEmail,
          phone: bookingData.customerPhone,
          address: bookingData.venueAddress
        },
        eventDetails: {
          type: "catering",
          date: bookingData.eventDate,
          time: bookingData.eventTime,
          location: bookingData.venue,
          guestCount: bookingData.guestCount
        },
        selectedItems: bookingData.selectedItems.map(item => ({
          itemId: item._id || item.itemId,
          quantity: item.quantity,
          eventDate: bookingData.eventDate // Add eventDate to each item
        })),
        pricing: {
          subtotal: bookingData.totalAmount,
          total: bookingData.totalAmount,
          deposit: 0
        },
        specialRequests: bookingData.specialInstructions
      };
      
      const res = await axios.post(`${API_URL}/customer/${catererID}/booking`, formattedBookingData);
      if (res.data.success) {
        return res.data;
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      if (error.message === 'Request throttled') {
        return thunkApi.rejectWithValue('Request throttled');
      }
      return thunkApi.rejectWithValue(handleApiError(error));
    }
  }
);

export const getBookingDetails = createAsyncThunk(
  'customer/getBookingDetails',
  async ({ catererID, bookingId }, thunkApi) => {
    try {
      const res = await axios.get(`${API_URL}/customer/${catererID}/booking/${bookingId}`);
      if (res.data.success) {
        return res.data;
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      return thunkApi.rejectWithValue(handleApiError(error));
    }
  }
);

export const submitFeedback = createAsyncThunk(
  'customer/submitFeedback',
  async ({ catererID, feedbackData }, thunkApi) => {
    try {
      // Throttle API calls
      if (shouldThrottle(lastFeedbackSubmitTime)) {
        return thunkApi.rejectWithValue('Request throttled');
      }
      lastFeedbackSubmitTime = Date.now();
      
      // Format the feedback data to match the server's expected structure
      const formattedFeedbackData = {
        customerInfo: {
          name: feedbackData.customerName || 'Anonymous',
          email: feedbackData.customerEmail || 'customer@example.com',
          phone: feedbackData.customerPhone || '1234567890'
        },
        ratings: {
          foodQuality: feedbackData.foodQualityRating || 5,
          service: feedbackData.serviceRating || 5,
          valueForMoney: feedbackData.valueForMoneyRating || 5,
          punctuality: feedbackData.punctualityRating || 5,
          overall: feedbackData.overallRating || 5
        },
        comments: feedbackData.comments || '',
        message: feedbackData.message || feedbackData.comments || '',
        subject: 'Feedback on your catering service',
        wouldRecommend: feedbackData.wouldRecommend || false,
        orderNumber: feedbackData.bookingId || ''
      };
      
      const res = await axios.post(`${API_URL}/customer/${catererID}/feedback`, formattedFeedbackData);
      if (res.data.success) {
        return res.data;
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      if (error.message === 'Request throttled') {
        return thunkApi.rejectWithValue('Request throttled');
      }
      return thunkApi.rejectWithValue(handleApiError(error));
    }
  }
);

export const sendContactMessage = createAsyncThunk(
  'customer/sendContactMessage',
  async ({ catererID, contactData }, thunkApi) => {
    try {
      const res = await axios.post(`${API_URL}/customer/${catererID}/contact`, contactData);
      if (res.data.success) {
        return res.data;
      } else {
        return thunkApi.rejectWithValue(res.data.message);
      }
    } catch (error) {
      return thunkApi.rejectWithValue(handleApiError(error));
    }
  }
);

// Customer slice
const customerSlice = createSlice({
  name: 'customer',
  initialState: {
    catererID: null,
    catererInfo: null,
    menuItems: [],
    popularItems: [],
    categories: [],
    selectedItems: [],
    guestCount: 0,
    currentCategory: '',
    totalCost: 0,
    perPlateCost: 0,
    discount: 0,
    quote: null,
    quoteId: null,
    booking: null,
    bookingId: null,
    eventDetails: null,
    dateAvailability: null,
    currentStep: 'menu', // menu, customize, quote, booking, confirmation
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    }
  },
  reducers: {
    setCurrentCategory: (state, action) => {
      state.currentCategory = action.payload;
    },
    addItem: (state, action) => {
      const item = action.payload;
      const existingItemIndex = state.selectedItems.findIndex(i => i.itemId === item._id);
      
      if (existingItemIndex !== -1) {
        // Item already exists in the selection, increment quantity
        state.selectedItems[existingItemIndex].quantity += 1;
      } else {
        // Add new item to selection
        state.selectedItems.push({
          itemId: item._id,
          name: item.name,
          price: item.price,
          quantity: 1
        });
      }
    },
    removeItem: (state, action) => {
      const itemId = action.payload;
      const existingItemIndex = state.selectedItems.findIndex(i => i.itemId === itemId);
      
      if (existingItemIndex !== -1) {
        if (state.selectedItems[existingItemIndex].quantity > 1) {
          // Decrement quantity if more than 1
          state.selectedItems[existingItemIndex].quantity -= 1;
        } else {
          // Remove item completely if quantity is 1
          state.selectedItems = state.selectedItems.filter(i => i.itemId !== itemId);
        }
      }
    },
    updateGuestCount: (state, action) => {
      state.guestCount = Math.max(0, action.payload);
    },
    setEventDetails: (state, action) => {
      state.eventDetails = action.payload;
    },
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
    },
    clearSelection: (state) => {
      state.selectedItems = [];
      state.totalCost = 0;
      state.perPlateCost = 0;
      state.discount = 0;
      state.quote = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    reset: (state) => {
      state.catererInfo = null;
      state.menuItems = [];
      state.popularItems = [];
      state.categories = [];
      state.selectedItems = [];
      state.guestCount = 0;
      state.currentCategory = '';
      state.totalCost = 0;
      state.perPlateCost = 0;
      state.discount = 0;
      state.quote = null;
      state.quoteId = null;
      state.booking = null;
      state.bookingId = null;
      state.eventDetails = null;
      state.dateAvailability = null;
      state.currentStep = 'menu';
      state.loading = false;
      state.error = null;
    },
    clearMenuItems: (state) => {
      state.menuItems = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Caterer Info
      .addCase(fetchCatererInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCatererInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.catererInfo = action.payload.caterer || action.payload.data || {};
        // Ensure dynamicPricing is present
        if (action.payload.caterer?.dynamicPricing || action.payload.data?.dynamicPricing) {
          state.catererInfo.dynamicPricing = action.payload.caterer?.dynamicPricing || action.payload.data?.dynamicPricing;
        }
        state.catererID = action.payload.caterer.catererID;
        state.error = null;
      })
      .addCase(fetchCatererInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Caterer Menu
      .addCase(fetchCatererMenu.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCatererMenu.fulfilled, (state, action) => {
        state.loading = false;
        state.catererInfo = action.payload.caterer || state.catererInfo;
        state.menuItems = action.payload.menuItems || action.payload.menu;
        state.pagination = action.payload.pagination || state.pagination;
        
        // Extract unique categories
        if (action.payload.menuItems || action.payload.menu) {
          const items = action.payload.menuItems || action.payload.menu;
          const uniqueCategories = [...new Set(items.map(item => item.category))];
          state.categories = uniqueCategories;
          
          // Set default category if available and not already set
          if (uniqueCategories.length > 0 && !state.currentCategory) {
            state.currentCategory = uniqueCategories[0];
          }
        }
        
        state.error = null;
      })
      .addCase(fetchCatererMenu.rejected, (state, action) => {
        state.loading = false;
        if (action.payload !== 'Request throttled') {
          state.error = action.payload;
        }
      })
      
      // Fetch Popular Menu Items
      .addCase(fetchPopularMenuItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPopularMenuItems.fulfilled, (state, action) => {
        state.loading = false;
        state.popularItems = action.payload.menuItems;
        state.error = null;
      })
      .addCase(fetchPopularMenuItems.rejected, (state, action) => {
        state.loading = false;
        if (action.payload !== 'Request throttled') {
          state.error = action.payload;
        }
      })
      
      // Calculate Quote
      .addCase(calculateQuote.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(calculateQuote.fulfilled, (state, action) => {
        state.loading = false;
        // Ensure these values are numbers for calculations
        state.totalCost = parseFloat(action.payload.quote.totalCost);
        state.perPlateCost = parseFloat(action.payload.quote.perPlateCost);
        state.discount = action.payload.quote.discountPercent;
        
        // Create a properly structured quote object with all necessary fields
        const currentDate = new Date();
        const validUntil = new Date();
        validUntil.setDate(currentDate.getDate() + 7);
        
        // Generate a simple sequential quote ID format
        const formatQuoteId = () => {
          // Get a unique number by using the last 2 digits of the timestamp
          const uniqueNumber = (Date.now() % 100).toString().padStart(2, '0');
          return `Q-${uniqueNumber}`;
        };
        
        // Build the quote object with eventDate from the payload
        state.quote = {
          ...action.payload.quote,
          quoteId: action.payload.quote.quoteId || formatQuoteId(),
          validUntil: validUntil.toISOString(),
          eventDate: action.payload.eventDate,
          createdAt: currentDate.toISOString()
        };
        
        state.quoteId = state.quote.quoteId;
        state.error = null;
      })
      .addCase(calculateQuote.rejected, (state, action) => {
        state.loading = false;
        if (action.payload !== 'Request throttled') {
          state.error = action.payload;
        }
      })
      
      // Check Date Availability
      .addCase(checkDateAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkDateAvailability.fulfilled, (state, action) => {
        state.loading = false;
        state.dateAvailability = action.payload.availability;
        state.error = null;
      })
      .addCase(checkDateAvailability.rejected, (state, action) => {
        state.loading = false;
        if (action.payload !== 'Request throttled') {
          state.error = action.payload;
        }
      })
      
      // Submit Booking
      .addCase(submitBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitBooking.fulfilled, (state, action) => {
        state.loading = false;
        // Create a booking object if it doesn't exist in the response
        if (!action.payload.booking) {
          const booking = {
            bookingId: action.payload.orderNumber || action.payload.orderId,
            customerName: state.quote?.customerName,
            customerEmail: state.quote?.customerEmail,
            customerPhone: state.quote?.customerPhone,
            eventDate: state.quote?.eventDate,
            eventTime: state.quote?.eventTime || "12:00",
            venue: state.quote?.venue || "Not specified",
            venueAddress: state.quote?.venueAddress || "Not specified",
            guestCount: state.quote?.guestCount || state.guestCount,
            totalAmount: state.totalCost,
            status: 'confirmed'
          };
          state.booking = booking;
          state.bookingId = booking.bookingId;
        } else {
          state.booking = action.payload.booking;
          state.bookingId = action.payload.booking.bookingId || action.payload.orderNumber;
        }
        state.currentStep = 'confirmation';
        state.error = null;
      })
      .addCase(submitBooking.rejected, (state, action) => {
        state.loading = false;
        if (action.payload !== 'Request throttled') {
          state.error = action.payload;
        }
      })
      
      // Get Booking Details
      .addCase(getBookingDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBookingDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.booking = action.payload.booking;
        state.error = null;
      })
      .addCase(getBookingDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Submit Feedback
      .addCase(submitFeedback.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitFeedback.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(submitFeedback.rejected, (state, action) => {
        state.loading = false;
        if (action.payload !== 'Request throttled') {
          state.error = action.payload;
        }
      })
      
      // Send Contact Message
      .addCase(sendContactMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendContactMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(sendContactMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  setCurrentCategory, 
  addItem, 
  removeItem, 
  updateGuestCount, 
  setEventDetails,
  setCurrentStep,
  clearSelection, 
  clearError,
  reset,
  clearMenuItems
} = customerSlice.actions;

export default customerSlice.reducer; 
