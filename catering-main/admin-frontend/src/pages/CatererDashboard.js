import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchMenuItems, fetchOrders } from '../redux/slices/catererSlice';
import CatererNavbar from '../components/caterer/CatererNavbar';
import '../components/caterer/CatererDashboard.css';
import ItemGrid from '../components/caterer/ItemGrid';
import '../components/caterer/ItemGrid.css';

const cardConfigs = [
  {
    title: 'Total Earnings',
    key: 'totalEarnings',
    gradient: 'linear-gradient(135deg, #fff7ae 0%, #ffe066 100%)', // gold/yellow
    textColor: '#b68900',
    icon: (
      <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
      </svg>
    ),
    to: '/caterer/orders',
  },
  {
    title: 'Pending Orders',
    key: 'pendingOrders',
    gradient: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', // soft blue
    textColor: '#3730a3',
    icon: (
      <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    to: '/caterer/orders',
  },
  {
    title: 'Menu Items',
    key: 'totalMenuItems',
    gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', // soft teal
    textColor: '#047857',
    icon: (
      <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    to: '/caterer/menu',
  },
  {
    title: 'Categories',
    key: 'totalCategories',
    gradient: 'linear-gradient(135deg, #ede9fe 0%, #c4b5fd 100%)', // soft purple
    textColor: '#6d28d9',
    icon: (
      <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    to: '/caterer/menu',
  },
];

const DashboardCard = ({ title, value, icon, gradient, textColor, onClick }) => (
  <div
    className={`rounded-lg shadow-md p-6 flex items-center justify-between transition-transform hover:scale-105 cursor-pointer`}
    onClick={onClick}
    style={{ minHeight: 120, background: gradient, color: textColor }}
  >
    <div>
      <h3 className="text-lg font-medium" style={{ color: textColor }}>{title}</h3>
      <p className="text-2xl font-bold mt-2" style={{ color: textColor }}>{value}</p>
    </div>
    <div style={{ color: textColor, opacity: 0.8 }}>{icon}</div>
  </div>
);

const CatererDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { catererInfo, menuItems, orders, loading } = useSelector(state => state.caterer);
  const [isFirstLogin, setIsFirstLogin] = useState(() => {
    // Check localStorage on mount
    return !!localStorage.getItem('firstLogin');
  });

  useEffect(() => {
    dispatch(fetchMenuItems());
    dispatch(fetchOrders());
    // Remove the flag after first dashboard mount
    if (localStorage.getItem('firstLogin')) {
      localStorage.removeItem('firstLogin');
    }
  }, [dispatch]);

  // Calculate dashboard metrics
  const totalMenuItems = menuItems ? menuItems.length : 0;
  const totalCategories = menuItems ? [...new Set(menuItems.map(item => item.category))].length : 0;
  const pendingOrders = orders ? orders.filter(order => order.status === 'pending').length : 0;
  // Calculate total earnings (sum of all completed orders' totals)
  const totalEarnings = orders ? orders.filter(order => order.status === 'completed').reduce((sum, order) => sum + (order.pricing?.total || 0), 0) : 0;

  // Popular and available items
  const popularItems = menuItems.filter(item => item.isPopular);
  const availableItems = menuItems.filter(item => item.available !== false); // default true if not set

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CatererNavbar />
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CatererNavbar />
      <div className="main-content py-8 px-4 sm:px-6 lg:px-8" style={{ marginTop: 40 }}>
        <div className="dashboard-container max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', width: '100%' }}>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ marginTop: 24, lineHeight: 1.15, marginBottom: 0 }}>
                  {isFirstLogin ? 'Welcome,' : 'Welcome back,'}<br />
                  <span style={{
                    display: 'inline-block',
                    maxWidth: '90vw',
                    wordBreak: 'break-word',
                    fontSize: 'clamp(1.1rem, 6vw, 2.5rem)',
                    fontWeight: 700,
                    lineHeight: 1.1,
                    verticalAlign: 'top',
                    marginTop: 4
                  }}>{catererInfo?.businessName || catererInfo?.name || 'Caterer'}</span>
                </h1>
                <p className="mt-2 text-md sm:text-lg text-gray-500">Here's your business overview.</p>
              </div>
              {catererInfo?.catererID && (
                <Link
                  to={`/order/${catererInfo.catererID}/guests`}
                  className="view-customer-btn-gold w-full sm:w-auto text-center sm:ml-auto"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ marginLeft: 20, marginTop: 8, marginBottom: 0, height: 'fit-content' }}
                >
                  View Customer Page
                </Link>
              )}
            </div>
          </div>
          <div className="dashboard-card-grid">
            {cardConfigs.map(card => (
              <DashboardCard
                key={card.key}
                title={card.title}
                value={
                  card.key === 'totalEarnings' ?
                    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalEarnings) :
                  card.key === 'pendingOrders' ? pendingOrders :
                  card.key === 'totalMenuItems' ? totalMenuItems :
                  totalCategories
                }
                icon={card.icon}
                gradient={card.gradient}
                textColor={card.textColor}
                onClick={() => navigate(card.to)}
              />
            ))}
          </div>
          {/* Popular Items Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Popular Items</h2>
            {popularItems.length > 0 ? (
              <ItemGrid items={popularItems} />
            ) : (
              <div className="text-gray-500">No popular items marked yet.</div>
            )}
          </div>
          {/* Available Items Section */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Available Items</h2>
            {availableItems.length > 0 ? (
              <ItemGrid items={availableItems} />
            ) : (
              <div className="text-gray-500">No available items.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatererDashboard; 