import React, { useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const CustomerHeader = ({ catererInfo }) => {
  const { catererID } = useParams();
  const location = useLocation();
  const { selectedItems } = useSelector(state => state.customer);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Calculate total items in cart
  const itemCount = selectedItems.reduce((total, item) => total + item.quantity, 0);
  
  // Navigation links
  const navLinks = [
    { name: 'Home', path: `/customer/${catererID}` },
    { name: 'Menu', path: `/customer/${catererID}/menu` },
    { name: 'Booking', path: `/customer/${catererID}/booking` },
    { name: 'Track Order', path: `/customer/${catererID}/track` },
    { name: 'Feedback', path: `/customer/${catererID}/feedback` },
    { name: 'Contact', path: `/customer/${catererID}/contact` }
  ];
  
  // Check if a path is active
  const isActive = (path) => {
    // For track order paths with orderId, check if the base path matches
    if (path === `/customer/${catererID}/track` && location.pathname.startsWith(`/customer/${catererID}/track/`)) {
      return true;
    }
    return location.pathname === path;
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              {catererInfo?.businessLogo ? (
                <img
                  className="h-8 w-auto"
                  src={catererInfo.businessLogo}
                  alt={catererInfo.businessName}
                />
              ) : (
                <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                  {catererInfo?.businessName?.charAt(0) || 'C'}
                </div>
              )}
              <span className="ml-2 text-lg font-semibold text-gray-900">
                {catererInfo?.businessName || 'Catering Service'}
              </span>
            </div>
            
            {/* Desktop navigation */}
            <nav className="hidden md:ml-6 md:flex md:space-x-4">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive(link.path)
                      ? 'border-primary-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Cart button */}
          <div className="flex items-center">
            <Link
              to={`/customer/${catererID}/customize`}
              className="ml-4 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Cart {itemCount > 0 && <span className="ml-1">({itemCount})</span>}
            </Link>
            
            {/* Mobile menu button */}
            <div className="flex items-center md:hidden ml-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive(link.path)
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default CustomerHeader; 