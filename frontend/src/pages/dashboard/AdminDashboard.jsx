import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loadingVendorId, setLoadingVendorId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showVendorModal, setShowVendorModal] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchVendors();
  }, []);

  useEffect(() => {
    // console.log('Active tab changed to:', activeTab);
    // console.log('Current dashboard state:', dashboard);
  }, [activeTab, dashboard]);

  const fetchDashboard = async () => {
    try {
      const res = await API.get('/admin/dashboard');
      // console.log('Dashboard data received:', res.data);
      setDashboard(res.data);
    } catch (err) {
      console.error('Failed to fetch admin dashboard:', err);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await API.get('/admin/vendors');
      setVendors(res.data.reverse()); // Show latest first
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
    }
  };

  const approveVendor = async (id) => {
    try {
      setLoadingVendorId(id);
      await API.patch(`/admin/vendors/${id}/approve`);
      await fetchVendors();
      await fetchDashboard();
    } catch (err) {
      alert('Failed to approve vendor');
    } finally {
      setLoadingVendorId(null);
    }
  };

  const rejectVendor = async (id) => {
    try {
      setLoadingVendorId(id);
      await API.delete(`/admin/vendors/${id}`);
      await fetchVendors();
      await fetchDashboard();
    } catch (err) {
      alert('Failed to reject vendor');
    } finally {
      setLoadingVendorId(null);
    }
  };

  const showVendorDetails = (vendor) => {
    setSelectedVendor(vendor);
    setShowVendorModal(true);
  };

  const StatCard = ({ title, value, icon, color, change }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${color}`}>{value}</p>
          {change && (
            <p className="text-xs text-gray-500 mt-1">{change}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-700', '-100')}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  const TabButton = ({ id, label, active }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
        active
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your airport inventory system</p>
          </div>
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 px-8">
        <div className="flex space-x-1">
          <TabButton id="overview" label="Overview" active={activeTab === 'overview'} />
          <TabButton id="vendors" label="Vendor Management" active={activeTab === 'vendors'} />
          <TabButton id="manageVendors" label="Manage Vendors & Shops" active={activeTab === 'manageVendors'} />
          <TabButton id="analytics" label="Analytics" active={activeTab === 'analytics'} />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Vendors"
                value={dashboard.vendors}
                icon="📦"
                color="text-blue-700"
                change="+12% from last month"
              />
              <StatCard
                title="Total Shops"
                value={dashboard.shops}
                icon="🏬"
                color="text-green-700"
                change="+8% from last month"
              />
              <StatCard
                title="Total Cashiers"
                value={dashboard.cashiers}
                icon="👥"
                color="text-purple-700"
                change="+5% from last month"
              />
              <StatCard
                title="Total Products"
                value={dashboard.products}
                icon="🛒"
                color="text-orange-700"
                change="+15% from last month"
              />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Bills */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Bills</h2>
                  <span className="text-sm text-gray-500">Last 7 days</span>
                </div>
                <div className="space-y-4">
                  {dashboard.recentBills.slice(0, 5).map((bill) => (
                    <div key={bill._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-medium">₹</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Bill #{bill._id.slice(-6)}</p>
                          <p className="text-sm text-gray-500">
                            {bill.shopId?.name || 'N/A'} • {bill.cashierId?.name || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{bill.total}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(bill.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
                <div className="space-y-3">
                  <button 
                    className="w-full text-left p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors duration-200"
                    onClick={() => setActiveTab('manageVendors')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Manage Vendors & Shops</p>
                        <p className="text-sm text-gray-500">View vendors and their shops</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vendors' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Vendor Management</h2>
                <span className="text-sm text-gray-500">{vendors.length} total vendors</span>
              </div>
              
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                                             <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact & Address</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vendors.map((vendor) => (
                      <tr key={vendor._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium text-sm">
                                {(vendor.companyName || vendor.name || 'V').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{vendor.companyName || vendor.name || 'Unknown Vendor'}</div>
                              <div className="text-sm text-gray-500">ID: {vendor._id.slice(-6)}</div>
                            </div>
                          </div>
                        </td>
                                                 <td className="px-6 py-4">
                           <div className="text-sm text-gray-900">{vendor.email}</div>
                           <div className="text-sm text-gray-500">{vendor.phoneNumber || vendor.phone || 'No phone'}</div>
                           {vendor.address && (
                             <div className="text-sm text-gray-500 mt-1">
                               📍 {vendor.address}
                             </div>
                           )}
                         </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {vendor.approved ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg className="w-2 h-2 mr-1.5" fill="currentColor" viewBox="0 0 8 8">
                                <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26 2.974 7.25 8 2.193z"/>
                              </svg>
                              Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <svg className="w-2 h-2 mr-1.5" fill="currentColor" viewBox="0 0 8 8">
                                <path d="M4 0a4 4 0 100 8 4 4 0 000-8zM2.5 4a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"/>
                              </svg>
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {!vendor.approved ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => approveVendor(vendor._id)}
                                disabled={loadingVendorId === vendor._id}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                              >
                                {loadingVendorId === vendor._id ? (
                                  <svg className="animate-spin -ml-1 mr-1.5 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                                {loadingVendorId === vendor._id ? 'Approving...' : 'Approve'}
                              </button>
                              <button
                                onClick={() => rejectVendor(vendor._id)}
                                disabled={loadingVendorId === vendor._id}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Reject
                              </button>
                            </div>
                                                     ) : (
                             <span className="text-green-600 font-medium">✓ Approved</span>
                           )}
                           <button
                             onClick={() => showVendorDetails(vendor)}
                             className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium"
                           >
                             View Details
                           </button>
                         </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manageVendors' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Vendors & Shops Management</h2>
                <span className="text-sm text-gray-500">{vendors.length} total vendors</span>
              </div>
              
              {/* Loading State */}
              {!dashboard || !vendors ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading vendors and shops data...</p>
                </div>
              ) : (
                <>

                  
                  {/* Summary Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 text-lg">👥</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Total Cashiers</p>
                          <p className="text-2xl font-bold text-gray-900">{dashboard.cashiersList ? dashboard.cashiersList.length : 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 text-lg">🏪</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Total Shops</p>
                          <p className="text-2xl font-bold text-gray-900">{dashboard.shopsList ? dashboard.shopsList.length : 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-purple-600 text-lg">👨‍💼</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                          <p className="text-2xl font-bold text-gray-900">{vendors.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {vendors.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <p className="text-sm">No vendors found</p>
                        <p className="text-xs text-gray-400 mt-1">Vendors will appear here once they register</p>
                      </div>
                    ) : (
                      vendors.map((vendor) => {
                        // Get shops for this vendor with better error handling
                        const vendorShops = dashboard.shopsList 
                          ? dashboard.shopsList.filter(shop => {
                              // Handle both string and ObjectId comparisons
                              const shopVendorId = typeof shop.vendorId === 'object' ? shop.vendorId._id || shop.vendorId : shop.vendorId;
                              const vendorId = typeof vendor._id === 'object' ? vendor._id._id || vendor._id : vendor._id;
                              return shopVendorId === vendorId;
                            })
                          : [];
                        
                        // Count cashiers for each shop
                        const shopsWithCashierCount = vendorShops.map(shop => {
                          const cashierCount = dashboard.cashiersList 
                            ? dashboard.cashiersList.filter(cashier => {
                                const cashierShopId = typeof cashier.shopId === 'object' ? cashier.shopId._id || cashier.shopId : cashier.shopId;
                                const shopId = typeof shop._id === 'object' ? shop._id._id || shop._id : shop._id;
                                return String(cashierShopId) === String(shopId);
                              }).length
                            : 0;
                          return { ...shop, cashierCount };
                        });
                        
                        // Calculate total cashiers for this vendor
                        const totalCashiersForVendor = shopsWithCashierCount.reduce((total, shop) => total + shop.cashierCount, 0);
                        
                        return (
                          <div key={vendor._id} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Vendor Header */}
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold text-lg">
                                      {(vendor.companyName || vendor.name || 'V').charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{vendor.companyName || vendor.name || 'Unknown Vendor'}</h3>
                                                                         <div className="flex items-center space-x-4 text-sm text-gray-600">
                                       <span>📧 {vendor.email}</span>
                                       {(vendor.phoneNumber || vendor.phone) && <span>📞 {vendor.phoneNumber || vendor.phone}</span>}
                                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                         👥 {totalCashiersForVendor} Total Cashier{totalCashiersForVendor !== 1 ? 's' : ''}
                                       </span>
                                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                         vendor.approved 
                                           ? 'bg-green-100 text-green-800' 
                                           : 'bg-yellow-100 text-yellow-800'
                                       }`}>
                                         {vendor.approved ? '✓ Approved' : '⏳ Pending Approval'}
                                       </span>
                                     </div>
                                     {vendor.address && (
                                       <div className="text-sm text-gray-600 mt-2">
                                         📍 <span className="font-medium">Address:</span> {vendor.address}
                                       </div>
                                     )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {!vendor.approved && (
                                    <>
                                      <button
                                        onClick={() => approveVendor(vendor._id)}
                                        disabled={loadingVendorId === vendor._id}
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                      >
                                        {loadingVendorId === vendor._id ? (
                                          <svg className="animate-spin -ml-1 mr-1.5 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                          </svg>
                                        ) : (
                                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                        )}
                                        {loadingVendorId === vendor._id ? 'Approving...' : 'Approve'}
                                      </button>
                                      <button
                                        onClick={() => rejectVendor(vendor._id)}
                                        disabled={loadingVendorId === vendor._id}
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                      >
                                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Reject
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Vendor Shops */}
                            <div className="px-6 py-4">
                              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                                <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                Shops ({shopsWithCashierCount.length})
                              </h4>
                              
                              {shopsWithCashierCount.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {shopsWithCashierCount.map((shop) => (
                                    <div key={shop._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <h5 className="font-medium text-gray-900 mb-1">{shop.name}</h5>
                                          <p className="text-sm text-gray-600 mb-2">
                                            📍 {shop.location || 'Location not specified'}
                                          </p>
                                          <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                                            <span>🆔 {shop._id.slice(-6)}</span>
                                            <span>📅 {new Date(shop.createdAt).toLocaleDateString()}</span>
                                          </div>
                                          <div className="flex items-center space-x-2 text-xs">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                              👥 {shop.cashierCount} Cashier{shop.cashierCount !== 1 ? 's' : ''}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="ml-3">
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            Active
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-1 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                  </svg>
                                  <p className="text-sm">No shops found for this vendor</p>
                                  <p className="text-xs text-gray-400 mt-1">Shops will appear here once they are created</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Sales Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Monthly Sales Performance</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-600">Sales</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={dashboard.monthlySales.map((s) => ({
                    name: `${s._id.vendorName} (${s._id.month}/${s._id.year})`,
                    total: s.totalSales
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [`₹${value}`, 'Sales']}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="#4F46E5" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Additional Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Vendors</h3>
                <div className="space-y-4">
                  {dashboard.monthlySales
                    .sort((a, b) => b.totalSales - a.totalSales)
                    .slice(0, 5)
                    .map((vendor, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{vendor._id.vendorName}</p>
                            <p className="text-sm text-gray-500">{vendor._id.month}/{vendor._id.year}</p>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900">₹{vendor.totalSales}</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-700 font-medium">Active Vendors</span>
                    <span className="text-blue-700 font-bold">{vendors.filter(v => v.approved).length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700 font-medium">Total Shops</span>
                    <span className="text-green-700 font-bold">{dashboard.shops}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <span className="text-purple-700 font-medium">Total Cashiers</span>
                    <span className="text-purple-700 font-bold">{dashboard.cashiers}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="text-orange-700 font-medium">Total Products</span>
                    <span className="text-orange-700 font-bold">{dashboard.products}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
                 )}

         {/* Vendor Details Modal */}
         {showVendorModal && selectedVendor && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
             <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
               <div className="p-6 border-b border-gray-200">
                 <div className="flex items-center justify-between">
                   <h2 className="text-2xl font-bold text-gray-900">Vendor Details</h2>
                   <button
                     onClick={() => setShowVendorModal(false)}
                     className="text-gray-400 hover:text-gray-600 transition-colors"
                   >
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                   </button>
                 </div>
               </div>
               
               <div className="p-6 space-y-6">
                 {/* Vendor Header */}
                 <div className="flex items-center space-x-4">
                   <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                     <span className="text-blue-600 font-semibold text-2xl">
                       {(selectedVendor.companyName || selectedVendor.name || 'V').charAt(0).toUpperCase()}
                     </span>
                   </div>
                   <div>
                     <h3 className="text-xl font-semibold text-gray-900">
                       {selectedVendor.companyName || selectedVendor.name || 'Unknown Vendor'}
                     </h3>
                     <p className="text-sm text-gray-500">ID: {selectedVendor._id.slice(-6)}</p>
                   </div>
                 </div>

                 {/* Vendor Information */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                     <div>
                       <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Contact Information</h4>
                       <div className="space-y-2">
                         <div className="flex items-center space-x-2">
                           <span className="text-gray-400">📧</span>
                           <span className="text-gray-900">{selectedVendor.email}</span>
                         </div>
                         <div className="flex items-center space-x-2">
                           <span className="text-gray-400">📞</span>
                           <span className="text-gray-900">
                             {selectedVendor.phoneNumber || selectedVendor.phone || 'No phone number'}
                           </span>
                         </div>
                       </div>
                     </div>

                     <div>
                       <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Address</h4>
                       <div className="flex items-start space-x-2">
                         <span className="text-gray-400 mt-1">📍</span>
                         <span className="text-gray-900">
                           {selectedVendor.address || 'No address provided'}
                         </span>
                       </div>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <div>
                       <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Account Status</h4>
                       <div className="space-y-2">
                         <div className="flex items-center space-x-2">
                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                             selectedVendor.approved 
                               ? 'bg-green-100 text-green-800' 
                               : 'bg-yellow-100 text-yellow-800'
                           }`}>
                             {selectedVendor.approved ? '✓ Approved' : '⏳ Pending Approval'}
                           </span>
                         </div>
                         <div className="text-sm text-gray-500">
                           Registered: {new Date(selectedVendor.createdAt || Date.now()).toLocaleDateString()}
                         </div>
                       </div>
                     </div>

                     {!selectedVendor.approved && (
                       <div>
                         <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Actions</h4>
                         <div className="flex space-x-2">
                           <button
                             onClick={() => {
                               approveVendor(selectedVendor._id);
                               setShowVendorModal(false);
                             }}
                             disabled={loadingVendorId === selectedVendor._id}
                             className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                           >
                             {loadingVendorId === selectedVendor._id ? (
                               <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                               </svg>
                             ) : (
                               <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                               </svg>
                             )}
                             {loadingVendorId === selectedVendor._id ? 'Approving...' : 'Approve Vendor'}
                           </button>
                           <button
                             onClick={() => {
                               rejectVendor(selectedVendor._id);
                               setShowVendorModal(false);
                             }}
                             disabled={loadingVendorId === selectedVendor._id}
                             className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                           >
                             <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                             </svg>
                             Reject Vendor
                           </button>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             </div>
           </div>
         )}
       </div>
     </div>
   );
 };

export default AdminDashboard;