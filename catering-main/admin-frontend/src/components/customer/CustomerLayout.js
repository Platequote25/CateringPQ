import React, { useEffect } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCatererInfo } from '../../redux/slices/customerSlice';
import CustomerHeader from './CustomerHeader';
import CustomerFooter from './CustomerFooter';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CustomerLayout = () => {
  const { catererID } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { catererInfo, loading, error } = useSelector(state => state.customer);
  
  useEffect(() => {
    if (catererID) {
      dispatch(fetchCatererInfo(catererID))
        .unwrap()
        .catch(err => {
          console.error('Error fetching caterer info:', err);
          if (err !== 'Request throttled') {
            navigate('/404');
          }
        });
    }
  }, [catererID, dispatch, navigate]);
  
  if (loading && !catererInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (error && !catererInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Caterer Not Found</h2>
          <p className="text-gray-600">The caterer you're looking for doesn't exist or is currently unavailable.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <CustomerHeader catererInfo={catererInfo} />
      <main className="flex-grow">
        <Outlet />
      </main>
      <CustomerFooter catererInfo={catererInfo} />
    </div>
  );
};

export default CustomerLayout; 