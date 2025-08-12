import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { io } from 'socket.io-client';

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

const VendorDashboard = () => {
  // State setup
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [shopData, setShopData] = useState({ name: '', location: '' });
  const [selectedQrFile, setSelectedQrFile] = useState(null);
  const [shopMessage, setShopMessage] = useState('');
  const [product, setProduct] = useState({ name: '', price: '', quantity: '' });
  const [cashier, setCashier] = useState({ name: '', email: '', password: '' });
  const [cashiersByShop, setCashiersByShop] = useState({});
  const [billsByShop, setBillsByShop] = useState({});
  const [productsByShop, setProductsByShop] = useState({});
  const [viewOption, setViewOption] = useState({});
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    productSales: [],
    salesPerDay: [],
  });
  const [selectedDate, setSelectedDate] = useState('');
  const [dailyProductSales, setDailyProductSales] = useState([]);
  const [salesPerShop, setSalesPerShop] = useState([]);
  const [showShopSales, setShowShopSales] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [qrEditState, setQrEditState] = useState({}); // { [shopId]: { file: File|null, loading: bool, error: string|null } }

  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchShops(),
          fetchAnalytics(),
          fetchSalesPerShop()
        ]);
      } catch (error) {
        console.error('Failed to initialize dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();

    const socket = io(import.meta.env.VITE_BACKEND_URL);
    socket.on('newBill', (data) => {
      if (data.shopId) fetchBills(data.shopId);
      fetchAnalytics();
      fetchSalesPerShop();
    });
    return () => socket.disconnect();
  }, []);

  // Fetch methods
  const fetchAnalytics = async () => {
    try {
      const res = await API.get('/analytics/vendor');
      setAnalytics(res.data);
    } catch {
      console.error('Failed to fetch analytics');
    }
  };

  const fetchSalesPerShop = async () => {
    try {
      const date = selectedDate || new Date().toISOString().split('T')[0];
      const res = await API.get(`/analytics/vendor/sales-per-shop?date=${date}`);
      setSalesPerShop(res.data);
    } catch {
      console.error('Failed to fetch sales per shop');
    }
  };

  const fetchDailyProductSales = async (date) => {
    try {
      const res = await API.get(`/analytics/vendor/daily-product-sales?date=${date}`);
      setDailyProductSales(res.data);
    } catch {
      console.error('Failed to fetch daily product sales');
    }
  };

  const fetchShops = async () => {
    try {
      const res = await API.get('/shops');
      setShops(res.data);
    } catch {
      console.error('Failed to fetch shops');
    }
  };

  const fetchCashiers = async (shopId) => {
    try {
      const res = await API.get(`/cashiers/${shopId}`);
      setCashiersByShop((prev) => ({ ...prev, [shopId]: res.data }));
    } catch {
      console.error('Failed to fetch cashiers');
    }
  };

  const fetchBills = async (shopId) => {
    try {
      const res = await API.get('/billing/vendor');
      const shopBills = res.data.filter((b) => b.shopId._id === shopId);
      setBillsByShop((prev) => ({ ...prev, [shopId]: shopBills }));
    } catch {
      console.error('Failed to fetch bills');
    }
  };

  const fetchProductsForShop = async (shopId) => {
    try {
      const res = await API.get(`/products/${shopId}`);
      setProductsByShop((prev) => ({ ...prev, [shopId]: res.data }));
    } catch {
      console.error('Failed to fetch products');
    }
  };

  const handleCreateShop = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', shopData.name);
      formData.append('location', shopData.location);
      
      if (selectedQrFile) {
        formData.append('upiQrCode', selectedQrFile);
      }

      const res = await API.post('/shops', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setShops([...shops, res.data.shop]);
      setShopData({ name: '', location: '' });
      setSelectedQrFile(null);
      setShopMessage('✅ Shop created successfully');
    } catch (err) {
      setShopMessage(err.response?.data?.msg || '❌ Failed to create shop');
    }
  };

  const handleProductChange = (e) =>
    setProduct({ ...product, [e.target.name]: e.target.value });
  const handleCashierChange = (e) =>
    setCashier({ ...cashier, [e.target.name]: e.target.value });

  const handleAddProduct = async (shopId) => {
    try {
      await API.post('/products', {
        ...product,
        price: Number(product.price),
        quantity: Number(product.quantity),
        shopId,
      });
      fetchProductsForShop(shopId);
      setProduct({ name: '', price: '', quantity: '' });
    } catch {
      alert('❌ Failed to add product');
    }
  };

  const handleAddCashier = async (shopId) => {
    try {
      await API.post('/cashiers', { ...cashier, shopId });
      fetchCashiers(shopId);
      setCashier({ name: '', email: '', password: '' });
    } catch {
      alert('❌ Failed to add cashier');
    }
  };

  const handleRemoveCashier = async (cashierId, shopId) => {
    try {
      await API.delete(`/cashiers/${cashierId}`);
      fetchCashiers(shopId);
    } catch {
      alert('❌ Failed to remove cashier');
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (date) {
      fetchDailyProductSales(date);
      fetchSalesPerShop(false);
    }
  };

  const handleQrFileChange = (shopId, file) => {
    setQrEditState((prev) => ({
      ...prev,
      [shopId]: { ...prev[shopId], file, error: null }
    }));
  };

  const handleQrUpload = async (shopId) => {
    if (!qrEditState[shopId]?.file) return;
    setQrEditState((prev) => ({ ...prev, [shopId]: { ...prev[shopId], loading: true, error: null } }));
    try {
      const formData = new FormData();
      formData.append('upiQrCode', qrEditState[shopId].file);
      const res = await API.patch(`/api/shops/${shopId}/qr`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Update the shop in the shops array
      setShops((prev) => prev.map((s) => s._id === shopId ? { ...s, upiQrCode: res.data.upiQrCode } : s));
      setQrEditState((prev) => ({ ...prev, [shopId]: { file: null, loading: false, error: null } }));
    } catch (err) {
      setQrEditState((prev) => ({ ...prev, [shopId]: { ...prev[shopId], loading: false, error: err.response?.data?.msg || 'Failed to update QR' } }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Vendor Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Vendor Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Manage your business operations and analytics</p>
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
              id="analytics"
              label="Analytics"
              active={activeTab === 'analytics'}
              onClick={() => setActiveTab('analytics')}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>}
            />
            <TabButton
              id="shops"
              label="Shop Management"
              active={activeTab === 'shops'}
              onClick={() => setActiveTab('shops')}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>}
            />
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Revenue"
                value={`₹${analytics.totalRevenue}`}
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>}
                color="bg-green-500"
                subtitle="All time earnings"
              />
              <StatCard
                title="Total Shops"
                value={shops.length}
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>}
                color="bg-blue-500"
                subtitle="Active locations"
              />
              <StatCard
                title="Best Selling Product"
                value={analytics.productSales[0]?.name || 'N/A'}
                icon={<svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>}
                color="bg-purple-500"
                subtitle={analytics.productSales[0] ? `${analytics.productSales[0].quantitySold} units sold` : 'No data'}
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 border border-blue-200"
                  onClick={() => setActiveTab('shops')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Create New Shop</p>
                      <p className="text-sm text-gray-500">Add a new location</p>
                    </div>
                  </div>
                </button>
                <button
                  className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200 border border-green-200"
                  onClick={() => setActiveTab('analytics')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">View Analytics</p>
                      <p className="text-sm text-gray-500">Business insights</p>
                    </div>
                  </div>
                </button>
                <button
                  className="w-full text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200 border border-purple-200"
                  onClick={() => setActiveTab('shops')}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Manage Staff</p>
                      <p className="text-sm text-gray-500">Cashiers & products</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
              <div className="space-y-4">
                {shops.slice(0, 3).map((shop) => (
                  <div key={shop._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{shop.name}</p>
                        <p className="text-sm text-gray-600">{shop.location}</p>
                      </div>
                    </div>
                    <button
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      onClick={() => setActiveTab('shops')}
                    >
                      Manage →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Sales Analytics Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
                Sales Analytics
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8 mb-6">
                <div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-2xl font-bold text-green-800">₹{analytics.totalRevenue}</p>
                    <p className="text-green-600 font-medium">Total Revenue</p>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="dateSelect" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date for Sales Analysis
                  </label>
                  <input
                    id="dateSelect"
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                  />
                </div>
              </div>

              <div className="mb-6">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-sm transition-colors duration-200 font-medium"
                  onClick={async () => {
                    if (!selectedDate) {
                      alert("Please select a date first.");
                      return;
                    }
                    try {
                      const res = await API.get(`/analytics/vendor/sales-per-shop?date=${selectedDate}`);
                      setSalesPerShop(res.data);
                      setShowShopSales(true);
                    } catch (err) {
                      console.error('❌ Failed to fetch sales per shop:', err);
                      alert('❌ Could not load shop sales data');
                    }
                  }}
                >
                  Show Sales per Shop
                </button>
              </div>

              {/* Daily Product Sales Chart */}
              {dailyProductSales.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Sales on {selectedDate}
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={dailyProductSales.map((item) => ({
                          name: item.name,
                          quantity: item.quantitySold,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar dataKey="quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Best Selling Products */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Selling Products</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <ul className="space-y-2">
                    {analytics.productSales.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center py-2 px-3 bg-white rounded border border-gray-200">
                        <span className="text-gray-700 font-medium">{item.name}</span>
                        <span className="text-gray-600">{item.quantitySold} units sold</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Sales per Shop Chart */}
              {showShopSales && salesPerShop.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales per Shop</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={salesPerShop.map((s) => ({
                          name: s.shopName,
                          totalSales: s.totalSales,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar dataKey="totalSales" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shop Management Tab */}
        {activeTab === 'shops' && (
          <div className="space-y-8">
            {/* Create Shop Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-200 pb-3">
                Create New Shop
              </h2>
              <form onSubmit={handleCreateShop} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-2">
                      Shop Name *
                    </label>
                    <input
                      id="shopName"
                      type="text"
                      name="name"
                      placeholder="Enter shop name"
                      value={shopData.name}
                      onChange={(e) => setShopData({ ...shopData, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="shopLocation" className="block text-sm font-medium text-gray-700 mb-2">
                      Terminal / Location *
                    </label>
                    <input
                      id="shopLocation"
                      type="text"
                      name="location"
                      placeholder="Enter terminal or location"
                      value={shopData.location}
                      onChange={(e) => setShopData({ ...shopData, location: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="upiQrCode" className="block text-sm font-medium text-gray-700 mb-2">
                    UPI QR Code Image
                  </label>
                  <input
                    id="upiQrCode"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelectedQrFile(e.target.files[0])}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload a UPI QR code image (PNG, JPG, JPEG). Max size: 5MB
                  </p>
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg shadow-sm transition-colors duration-200 font-medium"
                >
                  Create Shop
                </button>
              </form>
              {shopMessage && (
                <div className={`mt-4 p-3 rounded-lg ${
                  shopMessage.includes('✅') 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {shopMessage}
                </div>
              )}
            </div>

            {/* Shops Management */}
            {shops.map((shop) => (
              <div key={shop._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{shop.name}</h3>
                      <p className="text-gray-600">{shop.location}</p>
                    </div>
                    {shop.upiQrCode && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">UPI QR:</span>
                        <img 
                          src={`${import.meta.env.VITE_BACKEND_URL}/api/shops/qr-code/${(shop.upiQrCode || '').split('/').pop()}`}
                          alt="UPI QR Code"
                          className="w-8 h-8 rounded border"
                        />
                      </div>
                    )}
                  </div>
                  <button
                    className="text-blue-600 hover:text-blue-800 underline font-medium transition-colors duration-200"
                    onClick={() => {
                      setSelectedShopId(selectedShopId === shop._id ? null : shop._id);
                      if (!billsByShop[shop._id]) fetchBills(shop._id);
                      if (!productsByShop[shop._id]) fetchProductsForShop(shop._id);
                      if (!cashiersByShop[shop._id]) fetchCashiers(shop._id);
                    }}
                  >
                    {selectedShopId === shop._id ? 'Close Management' : 'Manage Shop'}
                  </button>
                </div>

                {selectedShopId === shop._id && (
                  <div className="mt-6">
                    {/* Management Options */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Management Options</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <button 
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 font-medium text-sm"
                          onClick={() => setViewOption({ [shop._id]: 'product' })}
                        >
                          Add Product
                        </button>
                        <button 
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 font-medium text-sm"
                          onClick={() => setViewOption({ [shop._id]: 'cashier' })}
                        >
                          Add Cashier
                        </button>
                        <button 
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 font-medium text-sm"
                          onClick={() => setViewOption({ [shop._id]: 'bills' })}
                        >
                          View Bills
                        </button>
                        <button 
                          className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 font-medium text-sm"
                          onClick={() => setViewOption({ [shop._id]: 'products' })}
                        >
                          View Products
                        </button>
                        <button 
                          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 font-medium text-sm"
                          onClick={() => setViewOption({ [shop._id]: 'qr' })}
                        >
                          Manage QR
                        </button>
                      </div>
                    </div>

                    {/* Add Product Form */}
                    {viewOption[shop._id] === 'product' && (
                      <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Add New Product</h4>
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <input 
                            type="text" 
                            name="name" 
                            placeholder="Product Name" 
                            value={product.name} 
                            onChange={handleProductChange} 
                            className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200" 
                          />
                          <input 
                            type="number" 
                            name="price" 
                            placeholder="Price" 
                            value={product.price} 
                            onChange={handleProductChange} 
                            className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200" 
                          />
                          <input 
                            type="number" 
                            name="quantity" 
                            placeholder="Quantity" 
                            value={product.quantity} 
                            onChange={handleProductChange} 
                            className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200" 
                          />
                        </div>
                        <button 
                          onClick={() => handleAddProduct(shop._id)} 
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-sm transition-colors duration-200 font-medium"
                        >
                          Add Product
                        </button>
                      </div>
                    )}

                    {/* Add Cashier Form */}
                    {viewOption[shop._id] === 'cashier' && (
                      <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Add New Cashier</h4>
                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <input 
                            type="text" 
                            name="name" 
                            placeholder="Cashier Name" 
                            value={cashier.name} 
                            onChange={handleCashierChange} 
                            className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200" 
                          />
                          <input 
                            type="email" 
                            name="email" 
                            placeholder="Email Address" 
                            value={cashier.email} 
                            onChange={handleCashierChange} 
                            className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200" 
                          />
                          <input 
                            type="password" 
                            name="password" 
                            placeholder="Password" 
                            value={cashier.password} 
                            onChange={handleCashierChange} 
                            className="p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200" 
                          />
                        </div>
                        <button 
                          onClick={() => handleAddCashier(shop._id)} 
                          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg shadow-sm transition-colors duration-200 font-medium"
                        >
                          Add Cashier
                        </button>
                        
                        {/* Existing Cashiers List */}
                        {cashiersByShop[shop._id]?.length > 0 && (
                          <div className="mt-6">
                            <h4 className="text-md font-semibold text-gray-900 mb-3">Current Cashiers</h4>
                            <div className="bg-white rounded-lg border border-gray-200">
                              <ul className="divide-y divide-gray-200">
                                {cashiersByShop[shop._id].map((c) => (
                                  <li key={c._id} className="py-3 px-4 flex justify-between items-center">
                                    <div>
                                      <span className="font-medium text-gray-800">{c.name}</span>
                                      <span className="text-gray-600 ml-2">({c.email})</span>
                                    </div>
                                    <button 
                                      onClick={() => handleRemoveCashier(c._id, shop._id)} 
                                      className="text-red-600 hover:text-red-800 font-medium hover:underline transition-colors duration-200"
                                    >
                                      Remove
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Bills View */}
                    {viewOption[shop._id] === 'bills' && billsByShop[shop._id] && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Bill Records</h4>
                        <div className="space-y-4">
                          {billsByShop[shop._id].map((b) => (
                            <div key={b._id} className="bg-white rounded-lg border border-gray-200 p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div className="font-mono text-sm text-gray-600">Bill #{b._id.slice(-5)}</div>
                                <div className="text-right">
                                  <div className="font-semibold text-gray-800">₹{b.total}</div>
                                  <div className="text-sm text-gray-600">{new Date(b.createdAt).toLocaleString()}</div>
                                </div>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-gray-700">Customer:</span> {b.customerName || 'N/A'}
                                </div>
                                <div>
                                  <span className="font-medium text-gray-700">Cashier:</span> {b.cashierId?.name || 'N/A'}
                                </div>
                              </div>
                              <div className="mt-3">
                                <span className="font-medium text-gray-700">Products:</span>
                                <ul className="mt-2 space-y-1">
                                  {b.items?.map((item, idx) => (
                                    <li key={idx} className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded">
                                      {item.productId?.name || item.productName || 'Unknown'} × {item.quantity}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div className="mt-3">
                                <a
                                  href={`${import.meta.env.VITE_BACKEND_URL}${b.pdfPath}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                                >
                                  View PDF Invoice
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Products View */}
                    {viewOption[shop._id] === 'products' && productsByShop[shop._id] && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Product Inventory</h4>
                        <div className="bg-white rounded-lg border border-gray-200">
                          <ul className="divide-y divide-gray-200">
                            {productsByShop[shop._id].map((p) => (
                              <li key={p._id} className="py-3 px-4 flex justify-between items-center">
                                <span className="font-medium text-gray-800">{p.name}</span>
                                <div className="text-right">
                                  <div className="font-semibold text-gray-800">₹{p.price}</div>
                                  <div className="text-sm text-gray-600">Qty: {p.quantity}</div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {viewOption[shop._id] === 'qr' && (
                      <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Update UPI QR Code</h4>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleQrFileChange(shop._id, e.target.files[0])}
                          className="mb-2"
                        />
                        <button
                          onClick={() => handleQrUpload(shop._id)}
                          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg shadow-sm transition-colors duration-200 font-medium"
                          disabled={qrEditState[shop._id]?.loading}
                        >
                          {qrEditState[shop._id]?.loading ? 'Uploading...' : 'Upload QR'}
                        </button>
                        {qrEditState[shop._id]?.error && (
                          <div className="text-red-600 mt-2">{qrEditState[shop._id].error}</div>
                        )}
    {shop.upiQrCode && (
                          <div className="mt-4">
                            <span className="text-sm text-gray-500">Current QR:</span>
                            <img
                                        src={`${import.meta.env.VITE_BACKEND_URL}/api/shops/qr-code/${(shop.upiQrCode || '').split('/').pop()}`}
                              alt="UPI QR Code"
                              className="w-24 h-24 rounded border mt-2"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;
