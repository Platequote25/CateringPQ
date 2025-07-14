import { configureStore } from '@reduxjs/toolkit';
import catererReducer from './slices/catererSlice';
import customerReducer from './slices/customerSlice';

const store = configureStore({
  reducer: {
    caterer: catererReducer,
    customer: customerReducer
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types since they may contain non-serializable values (like Date objects)
        ignoredActions: ['caterer/setSelectedDate', 'caterer/fetchTimelineEvents/fulfilled'],
        // Ignore these field paths in state
        ignoredPaths: ['caterer.selectedDate']
      },
    }),
});

export default store; 