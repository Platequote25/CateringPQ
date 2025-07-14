import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchOrders, updateOrderStatus } from '../../redux/slices/catererSlice';
import { toast } from 'react-toastify';
import CatererNavbar from './CatererNavbar';
import './OrderManagement.css';

const OrderManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orders, loading } = useSelector(state => state.caterer);
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  
  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    const inrAmount = amount * 83;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(inrAmount);
  };
  
  // Helper to get stored pricing values for an order
  const getOrderPricing = (order) => {
    const pricing = order.pricing || {};
    return {
      subtotal: Number(pricing.subtotal) || 0,
      misc: Number(order.pricing?.miscCost) || 0,
      discount: Number(pricing.discount) || 0,
      total: Number(pricing.total) || 0,
    };
  };
  
  // Filter orders based on status and search term
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders
      .filter(order => {
        // Only allow pending, completed, or cancelled
        const allowedStatuses = ['pending', 'completed', 'cancelled'];
        if (!allowedStatuses.includes(order.status.toLowerCase())) return false;
        const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter;
        const matchesSearch = 
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 7);
  }, [orders, statusFilter, searchTerm]);
  
  // Handle status change
  const handleStatusChange = () => {
    if (!selectedOrder || !newStatus) return;
    
    dispatch(updateOrderStatus({ 
      orderId: selectedOrder._id,
      status: newStatus
    }))
      .unwrap()
      .then(() => {
        toast.success(`Order status updated to ${newStatus}`);
        setIsModalOpen(false);
        setSelectedOrder(null);
        setNewStatus('');
      })
      .catch((err) => {
        toast.error(err || 'Failed to update order status');
      });
  };
  
  // Open status change modal
  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsModalOpen(true);
  };
  
  // Get badge color based on status
  const getStatusBadgeColor = (status) => {
    const statusMap = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    
    return statusMap[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };
  
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
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="order-container">
          <h2>Order Management</h2>
          <p>View and manage all customer orders</p>
          <div className="filter-row" style={{ justifyContent: 'space-between', gap: 0 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              <label htmlFor="statusFilter" style={{ fontSize: 16, color: '#6b7280', marginRight: 8, fontWeight: 600 }}>Status</label>
                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <label htmlFor="searchTerm" style={{ fontSize: 16, color: '#6b7280', marginRight: 8, fontWeight: 600 }}>Search</label>
                <input
                  type="text"
                  id="searchTerm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Order # or Name"
                style={{ fontSize: 16 }}
                />
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <button className="refresh-btn" onClick={() => dispatch(fetchOrders())} style={{ fontSize: 16, fontWeight: 600 }}>
                <span className="material-icons" style={{ fontSize: 20, marginRight: 6 }}>refresh</span>
                Refresh
              </button>
            </div>
          </div>
          {/* Responsive: Table on desktop, cards on mobile/tablet */}
          {!isMobile ? (
            <table className="order-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Event Name</th>
                  <th>Event Date</th>
                  <th>Event Time</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order._id}>
                      <td>{order.orderNumber}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{order.customer.name}</div>
                        <div style={{ color: '#888', fontSize: 12 }}>{order.customer.email}</div>
                      </td>
                      <td>{order.customer.phone}</td>
                      <td>{order.event?.eventName || '-'}</td>
                      <td>{formatDate(order.event.date)}</td>
                      <td>{order.event?.time || '-'}</td>
                      <td>{order.status}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <button className="order-btn" onClick={() => navigate(`/caterer/orders/${order._id}`)}>
                            View Order
                          </button>
                          <select
                            className="order-btn status-dropdown"
                            value={order.status}
                            onChange={e => {
                              const newStatus = e.target.value;
                              dispatch(updateOrderStatus({
                                orderId: order._id,
                                status: newStatus
                              }))
                                .unwrap()
                                .then((result) => {
                                  toast.success(`Order status updated to ${newStatus}`);
                                })
                                .catch((err) => {
                                  toast.error(err || 'Failed to update order status');
                                });
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: '#aaa' }}>No orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <div className="order-card-list">
              {filteredOrders.length > 0 ? (
                filteredOrders.map(order => (
                  <div className="order-card" key={order._id}>
                    <div className="order-card-row"><span className="order-card-label">Order #:</span> {order.orderNumber}</div>
                    <div className="order-card-row"><span className="order-card-label">Customer:</span> {order.customer.name} <span style={{ color: '#888', fontSize: 12 }}>({order.customer.email})</span></div>
                    <div className="order-card-row"><span className="order-card-label">Phone:</span> {order.customer.phone}</div>
                    <div className="order-card-row"><span className="order-card-label">Event Name:</span> {order.event?.eventName || '-'}</div>
                    <div className="order-card-row"><span className="order-card-label">Event Date:</span> {formatDate(order.event.date)}</div>
                    <div className="order-card-row"><span className="order-card-label">Event Time:</span> {order.event?.time || '-'}</div>
                    <div className="order-card-row"><span className="order-card-label">Status:</span> {order.status}</div>
                    <div className="order-card-row"><span className="order-card-label">Created:</span> {formatDate(order.createdAt)}</div>
                    <div className="order-card-actions">
                      <button className="order-btn" onClick={() => navigate(`/caterer/orders/${order._id}`)}>
                        View Order
                      </button>
                      <select
                        className="order-btn status-dropdown"
                        value={order.status}
                        onChange={e => {
                          const newStatus = e.target.value;
                          dispatch(updateOrderStatus({
                            orderId: order._id,
                            status: newStatus
                          }))
                            .unwrap()
                            .then((result) => {
                              toast.success(`Order status updated to ${newStatus}`);
                            })
                            .catch((err) => {
                              toast.error(err || 'Failed to update order status');
                            });
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: '#aaa', padding: 16 }}>No orders found.</div>
              )}
            </div>
          )}
          </div>
        
        {/* Status Change Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 overflow-y-auto z-50">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Update Order Status
                      </h3>
                      <div className="mt-4">
                        <label htmlFor="newStatus" className="block text-sm font-medium text-gray-700">
                          New Status
                        </label>
                        <select
                          id="newStatus"
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleStatusChange}
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement; 