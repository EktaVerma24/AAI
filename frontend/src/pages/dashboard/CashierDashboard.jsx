import React, { useEffect, useState } from 'react';
import API from '../../utils/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Professional StatCard Component
const StatCard = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

// Professional TabButton Component
const TabButton = ({ id, label, active, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
      active
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const CashierDashboard = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [billHistory, setBillHistory] = useState([]);
  const [showAllBills, setShowAllBills] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentType, setPaymentType] = useState('cash');
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [shopInfo, setShopInfo] = useState(null);

  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchProducts(),
          fetchBillHistory(),
          fetchShopInfo()
        ]);
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get('/products/shop');
      setProducts(res.data);
    } catch {
      console.error('Failed to load products');
    }
  };

  const fetchBillHistory = async () => {
    try {
      const res = await API.get('/billing/cashier');
      setBillHistory(res.data);
    } catch {
      console.error('Failed to fetch billing history');
    }
  };

  const fetchShopInfo = async () => {
    try {
      const res = await API.get('/shops/cashier-shop');
      setShopInfo(res.data);
    } catch (err) {
      console.error('Failed to fetch shop info:', err);
    }
  };

  const addToCart = (productId, quantity) => {
    const product = products.find((p) => p._id === productId);
    if (!product) return;

    if (product.quantity === 0) {
      toast.error('❌ This product is out of stock.');
      return;
    }

    const existing = cart.find((item) => item.productId === productId);
    const currentQty = existing ? existing.quantity : 0;

    if (currentQty + quantity > product.quantity) {
      toast.error(`❌ Only ${product.quantity} units available in stock.`);
      return;
    }

    setCart((prev) =>
      existing
        ? prev.map((item) =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        : [...prev, { productId, quantity }]
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const generateBill = async () => {
    setIsGenerating(true);
    try {
      const res = await API.post('/billing', {
        items: cart,
        customerName: customer.name,
        customerPhone: customer.phone,
        paymentType
      });

      toast.success('✅ Bill generated successfully!');
      setMessage(res.data.msg);
      const backendBase = import.meta.env.VITE_BACKEND_URL;
      setInvoiceUrl(`${backendBase}${res.data.pdfPath}`);
      setCart([]);
      setCustomer({ name: '', phone: '' });
      fetchProducts();
      fetchBillHistory();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Billing failed');
    } finally {
      setIsGenerating(false);
      setShowQR(false);
    }
  };

  const handleBilling = async () => {
    if (!customer.name.trim()) {
      toast.error('❌ Customer name is required.');
      return;
    }

    if (!/^\d{10}$/.test(customer.phone.trim())) {
      toast.error('❌ Customer phone must be exactly 10 digits.');
      return;
    }

    if (cart.length === 0) {
      toast.error('❌ Your cart is empty.');
      return;
    }

    if (paymentType === 'cash') {
      const confirmCash = window.confirm('Has the cash payment been received?');
      if (!confirmCash) {
        toast.info('💡 Cash payment not confirmed.');
        return;
      }
      await generateBill();
    } else {
      setShowQR(true);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate cart total
  const cartTotal = cart.reduce((total, item) => {
    const product = products.find((p) => p._id === item.productId);
    return total + (product?.price || 0) * item.quantity;
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Cashier Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      {/* Professional Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Cashier Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Manage transactions and billing operations</p>
            </div>
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg shadow-sm transition-colors duration-200 font-medium"
              onClick={() => {
                localStorage.clear();
                window.location.href = '/';
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Professional Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap gap-3">
            <TabButton
              id="overview"
              label="Overview"
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>}
            />
            <TabButton
              id="billing"
              label="Billing"
              active={activeTab === 'billing'}
              onClick={() => setActiveTab('billing')}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>}
            />
            <TabButton
              id="history"
              label="History"
              active={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>}
            />
          </div>
        </div>

        {/* Success Messages */}
        {message && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-medium">{message}</p>
          </div>
        )}
        
        {invoiceUrl && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <a
              href={invoiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:text-blue-800 font-medium underline inline-flex items-center"
            >
              📄 View Latest Invoice
            </a>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Products"
                value={products.length}
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>}
                color="bg-blue-500"
                subtitle="Available items"
              />
              <StatCard
                title="Cart Items"
                value={cart.length}
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m6 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>}
                color="bg-green-500"
                subtitle="Current cart"
              />
              <StatCard
                title="Total Bills"
                value={billHistory.length}
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>}
                color="bg-purple-500"
                subtitle="Generated till now"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 border border-blue-200"
                  onClick={() => setActiveTab('billing')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Start New Bill</p>
                      <p className="text-sm text-gray-500">Create customer bill</p>
                    </div>
                  </div>
                </button>
                <button
                  className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200 border border-green-200"
                  onClick={() => setActiveTab('billing')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Search Products</p>
                      <p className="text-sm text-gray-500">Find items quickly</p>
                    </div>
                  </div>
                </button>
                <button
                  className="w-full text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200 border border-purple-200"
                  onClick={() => setActiveTab('history')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">View History</p>
                      <p className="text-sm text-gray-500">Past transactions</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Current Cart Summary */}
            {cart.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Current Cart Summary</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">Cart Items ({cart.length})</h3>
                    <div className="space-y-2">
                      {cart.map((item, idx) => {
                        const product = products.find((p) => p._id === item.productId);
                        return (
                          <div
                            key={idx}
                            className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded border border-gray-200"
                          >
                            <span className="text-gray-700">
                              {product?.name || item.productId} × {item.quantity}
                            </span>
                            <span className="text-gray-600 font-medium">
                              ₹{(product?.price || 0) * item.quantity}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-800">₹{cartTotal}</p>
                      <p className="text-blue-600 font-medium">Total Amount</p>
                      <button
                        className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
                        onClick={() => setActiveTab('billing')}
                      >
                        Complete Bill →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="space-y-8">
            {/* Search Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="max-w-md">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Products
                </label>
                <div className="relative">
                  <input
                    id="search"
                    type="text"
                    placeholder="Enter product name..."
                    className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
                Available Products
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => {
                  const cartItem = cart.find((item) => item.productId === product._id);
                  return (
                    <div
                      key={product._id}
                      className="bg-gray-50 rounded-lg p-5 border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 text-lg mb-2">{product.name}</h3>
                          <div className="space-y-1">
                            <p className="text-gray-600">
                              <span className="font-medium">Price:</span> ₹{product.price}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Stock:</span> {product.quantity} units
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 font-medium text-sm"
                          onClick={() => addToCart(product._id, 1)}
                        >
                          Add to Cart
                        </button>
                        {cartItem && (
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 font-medium text-sm"
                            onClick={() => removeFromCart(product._id)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shopping Cart */}
            {cart.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
                  Shopping Cart
                </h2>

                {/* Customer Information */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name *
                    </label>
                    <input
                      id="customerName"
                      type="text"
                      placeholder="Enter customer name"
                      className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      id="customerPhone"
                      type="tel"
                      placeholder="10-digit phone number"
                      className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                      maxLength={10}
                      inputMode="numeric"
                      value={customer.phone}
                      onChange={(e) =>
                        setCustomer({
                          ...customer,
                          phone: e.target.value.replace(/\D/g, '')
                        })
                      }
                    />
                  </div>
                </div>

                {/* Cart Items */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-gray-700 mb-3">Cart Items</h3>
                  <div className="space-y-2">
                    {cart.map((item, idx) => {
                      const product = products.find((p) => p._id === item.productId);
                      return (
                        <div
                          key={idx}
                          className="flex justify-between items-center py-2 px-3 bg-white rounded border border-gray-200"
                        >
                          <span className="text-gray-700">
                            {product?.name || item.productId} × {item.quantity}
                          </span>
                          <div className="flex items-center space-x-3">
                            <span className="text-gray-600 font-medium">
                              ₹{(product?.price || 0) * item.quantity}
                            </span>
                            <button
                              className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline transition-colors duration-200"
                              onClick={() => removeFromCart(item.productId)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-800">Total:</span>
                      <span className="text-2xl font-bold text-blue-600">₹{cartTotal}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    id="paymentMethod"
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                  >
                    <option value="cash">Cash Payment</option>
                    <option value="upi">UPI Payment</option>
                  </select>
                </div>

                {/* Generate Bill Button */}
                {isGenerating ? (
                  <button
                    className="w-full bg-gray-400 text-white px-6 py-3 rounded-lg font-medium cursor-not-allowed"
                    disabled
                  >
                    ⏳ Generating Bill...
                  </button>
                ) : (
                  <button
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-sm transition-colors duration-200 font-medium"
                    onClick={handleBilling}
                  >
                    Generate Bill
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-8">
            {/* Billing History */}
            {billHistory.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
                  Billing History
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Bill ID</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Customer</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Invoice</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(showAllBills ? billHistory : billHistory.slice(0, 5)).map(
                        (bill) => (
                          <tr
                            key={bill._id}
                            className="hover:bg-gray-50 transition-colors duration-200"
                          >
                            <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                              {bill._id.slice(-5)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {bill.customerName || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {new Date(bill.createdAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                              ₹{bill.total}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <a
                                href={`${import.meta.env.VITE_BACKEND_URL}${bill.pdfPath}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline font-medium"
                              >
                                View PDF
                              </a>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                  {billHistory.length > 5 && (
                    <div className="mt-6 text-center">
                      <button
                        className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors duration-200"
                        onClick={() => setShowAllBills((prev) => !prev)}
                      >
                        {showAllBills ? 'Show Less ▲' : 'Show More ▼'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR Payment Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">UPI Payment</h2>
            <div className="text-center mb-6">
              {shopInfo?.upiQrCode ? (
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL}/api/shops/qr-code/${(shopInfo.upiQrCode || '').split('/').pop()}`}
                  alt="UPI QR Code"
                  className="w-48 h-48 mx-auto border-2 border-gray-200 rounded-lg shadow-sm object-contain"
                />
              ) : (
                <div className="w-48 h-48 mx-auto border-2 border-gray-200 rounded-lg shadow-sm flex items-center justify-center bg-gray-50">
                  <p className="text-gray-500 text-center">No UPI QR Code<br/>Available</p>
                </div>
              )}
            </div>
            <p className="text-gray-600 text-center mb-6">
              Please scan the QR code to complete your payment. Once payment is confirmed, click the button below.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={generateBill}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg shadow-sm transition-colors duration-200 font-medium"
              >
                Payment Confirmed
              </button>
              <button
                onClick={() => setShowQR(false)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg shadow-sm transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierDashboard;
