import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [loadingVendorId, setLoadingVendorId] = useState(null);

  useEffect(() => {
    fetchDashboard();
    fetchVendors();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await API.get('/admin/dashboard');
      setDashboard(res.data);
    } catch (err) {
      console.error('Failed to fetch admin dashboard');
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await API.get('/admin/vendors');
      setVendors(res.data.reverse()); // Show latest first
    } catch (err) {
      console.error('Failed to fetch vendors');
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

  return (
    <div className="min-h-screen relative p-8 bg-gray-100">
      <button
        className="absolute top-4 right-6 bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
        onClick={() => {
          localStorage.clear();
          window.location.href = '/';
        }}
      >
        Logout
      </button>

      <h1 className="text-3xl font-bold text-blue-700 mb-6">Admin Dashboard</h1>

      {!dashboard ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {['vendors', 'shops', 'cashiers', 'products'].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded shadow-md">
              <h2 className="text-xl font-semibold mb-2">
                {item === 'vendors' && '📦 Total Vendors'}
                {item === 'shops' && '🏬 Total Shops'}
                {item === 'cashiers' && '👥 Total Cashiers'}
                {item === 'products' && '🛒 Total Products'}
              </h2>
              <p className="text-3xl font-bold text-indigo-700 mb-3">{dashboard[item]}</p>
              <div className="mt-2 max-h-36 overflow-auto border-t pt-2">
                <ul className="text-sm divide-y">
                  {dashboard[item + 'List']?.map((d, idx) => (
                    <li key={idx} className="py-1 text-gray-700">
                      {item === 'vendors' && `${d.name} (${d.email})`}
                      {item === 'shops' && `${d.name} (${d.location})`}
                      {item === 'cashiers' && `${d.name} (${d.email})`}
                      {item === 'products' && `${d.name} - ₹${d.price}`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          <div className="bg-white p-6 rounded shadow-md col-span-2">
            <h2 className="text-xl font-semibold mb-4">🧾 Recent Bills</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2">Bill ID</th>
                    <th className="px-4 py-2">Vendor</th>
                    <th className="px-4 py-2">Shop</th>
                    <th className="px-4 py-2">Cashier</th>
                    <th className="px-4 py-2">Total</th>
                    <th className="px-4 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentBills.map((bill) => (
                    <tr key={bill._id} className="border-b">
                      <td className="px-4 py-2">{bill._id}</td>
                      <td className="px-4 py-2">{bill.shopId?.vendorId?.name || 'N/A'}</td>
                      <td className="px-4 py-2">{bill.shopId?.name || 'N/A'}</td>
                      <td className="px-4 py-2">{bill.cashierId?.name || 'N/A'}</td>
                      <td className="px-4 py-2">₹{bill.total}</td>
                      <td className="px-4 py-2">{new Date(bill.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-6 rounded shadow-md col-span-2">
            <h2 className="text-xl font-semibold mb-4">📊 Monthly Sales Per Vendor</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={dashboard.monthlySales.map((s) => ({
                  name: `${s._id.vendorName} (${s._id.month}/${s._id.year})`,
                  total: s.totalSales
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded shadow-md col-span-2">
            <h2 className="text-xl font-semibold mb-4">🧑‍💼 Vendor Approvals</h2>
            <ul className="divide-y">
              {vendors.map((v) => (
                <li
                  key={v._id}
                  className="py-2 flex justify-between items-center text-gray-800"
                >
                  <div>
                    <p className="font-medium">
                      {v.name} ({v.email})
                    </p>
                    {!v.approved && (
                      <span className="text-yellow-500 text-sm">
                        Pending Approval
                      </span>
                    )}
                  </div>
                  <div className="space-x-2">
                    {!v.approved ? (
                      <>
                        <button
                          onClick={() => approveVendor(v._id)}
                          className="bg-green-500 text-white px-3 py-1 rounded disabled:opacity-50"
                          disabled={loadingVendorId === v._id}
                        >
                          {loadingVendorId === v._id ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => rejectVendor(v._id)}
                          className="bg-red-500 text-white px-3 py-1 rounded disabled:opacity-50"
                          disabled={loadingVendorId === v._id}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-green-600">Approved</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;