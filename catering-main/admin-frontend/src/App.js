import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector, useDispatch } from 'react-redux';
import store from './redux/store';
import { fetchCatererProfile } from './redux/slices/catererSlice';
import './App.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import pages
import CatererLogin from './pages/CatererLogin';
import CatererRegister from './pages/CatererRegister';
import CatererDashboard from './pages/CatererDashboard';
import MenuManager from './components/caterer/MenuManager';
import Settings from './components/caterer/Settings';
import NotFound from './pages/NotFound';
import AddMenuItem from './pages/AddMenuItem';
import OrderManagement from './components/caterer/OrderManagement';
import OrderDetails from './components/caterer/OrderDetails';
import OrderFlow from './components/customer/OrderFlow';
import CustomerHome from './pages/CustomerHome';
import CustomerMenu from './pages/CustomerMenu';
import CustomizeOrder from './pages/CustomizeOrder';
import QuoteDetails from './pages/QuoteDetails';
import BookingForm from './pages/BookingForm';
import OrderConfirmation from './pages/OrderConfirmation';
import TrackOrder from './pages/TrackOrder';
import FeedbackForm from './pages/FeedbackForm';
import ContactForm from './pages/ContactForm';
import CustomerLayout from './components/customer/CustomerLayout';
import ForgotPassword from './pages/ForgotPassword';

// Import protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, authChecked } = useSelector(state => state.caterer);
  const dispatch = useDispatch();
  const [authCheckStarted, setAuthCheckStarted] = useState(false);
  
  useEffect(() => {
    // Check authentication status only once
    if (!authCheckStarted) {
      if (!isAuthenticated && localStorage.getItem('token')) {
        dispatch(fetchCatererProfile());
      }
      setAuthCheckStarted(true);
    }
  }, [dispatch, isAuthenticated, authCheckStarted]);
  
  // Show loading spinner while checking auth
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!isAuthenticated && authChecked) {
    return <Navigate to="/caterer/login" replace />;
  }
  
  return children;
};

function AppContent() {
  const dispatch = useDispatch();
  const [initialAuthCheckDone, setInitialAuthCheckDone] = useState(false);
  
  useEffect(() => {
    // Check if user is authenticated on app load - only once
    if (!initialAuthCheckDone && localStorage.getItem('token')) {
      dispatch(fetchCatererProfile())
        .unwrap()
        .then(() => {
        })
        .catch((err) => {
          // Clear invalid token
          if (err === 'No auth token' || err.includes('unauthorized')) {
            localStorage.removeItem('token');
          }
        });
      setInitialAuthCheckDone(true);
    }
  }, [dispatch, initialAuthCheckDone]);
  
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<CatererLogin />} />
          <Route path="/caterer/register" element={<CatererRegister />} />

          {/* Customer Order Flow Route */}
          <Route path="/order/:catererID/*" element={<OrderFlow />} />

          {/* Customer Routes */}
          <Route path="/customer/:catererID" element={<CustomerLayout />}>
            <Route index element={<CustomerHome />} />
            <Route path="menu" element={<CustomerMenu />} />
            <Route path="customize" element={<CustomizeOrder />} />
            <Route path="quote" element={<QuoteDetails />} />
            <Route path="booking" element={<BookingForm />} />
            <Route path="confirmation" element={<OrderConfirmation />} />
            <Route path="track" element={<TrackOrder />} />
            <Route path="track/:orderId" element={<TrackOrder />} />
            <Route path="feedback" element={<FeedbackForm />} />
            <Route path="contact" element={<ContactForm />} />
          </Route>

          {/* Protected Caterer Routes */}
          <Route path="/caterer/dashboard" element={
            <ProtectedRoute>
              <CatererDashboard />
            </ProtectedRoute>
          } />
          <Route path="/caterer/menu" element={
            <ProtectedRoute>
              <MenuManager />
            </ProtectedRoute>
          } />
          <Route path="/caterer/menu/add" element={<AddMenuItem />} />
          <Route path="/caterer/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/caterer/orders" element={
            <ProtectedRoute>
              <OrderManagement />
            </ProtectedRoute>
          } />
          <Route path="/caterer/orders/:id" element={
            <ProtectedRoute>
              <OrderDetails />
            </ProtectedRoute>
          } />

          {/* Forgot Password Route */}
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Catch all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <ToastContainer />
    </Router>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
