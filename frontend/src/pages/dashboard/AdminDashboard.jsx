import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [vendors, setVendors] = useState([]);

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
      setVendors(res.data);
    } catch (err) {
      console.error('Failed to fetch vendors');
    }
  };

  const approveVendor = async (id) => {
    try {
      await API.patch(`/admin/vendors/${id}/approve`);
      fetchVendors();
    } catch (err) {
      alert('Failed to approve vendor');
    }
  };

  const rejectVendor = async (id) => {
    try {
      await API.delete(`/admin/vendors/${id}`);
      fetchVendors();
    } catch (err) {
      alert('Failed to reject vendor');
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
          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-semibold">📦 Total Vendors</h2>
            <p className="text-2xl mt-2">{dashboard.vendors}</p>
          </div>

          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-semibold">🏬 Total Shops</h2>
            <p className="text-2xl mt-2">{dashboard.shops}</p>
          </div>

          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-semibold">👥 Total Cashiers</h2>
            <p className="text-2xl mt-2">{dashboard.cashiers}</p>
          </div>

          <div className="bg-white p-6 rounded shadow-md">
            <h2 className="text-xl font-semibold">🛒 Total Products</h2>
            <p className="text-2xl mt-2">{dashboard.products}</p>
          </div>

          <div className="bg-white p-6 rounded shadow-md col-span-2">
            <h2 className="text-xl font-semibold mb-4">🧾 Recent Bills</h2>
            <ul className="divide-y">
              {dashboard.recentBills.map((bill) => (
                <li key={bill._id} className="py-2">
                  Bill ID: {bill._id} | Total: ₹{bill.total} | Shop: {bill.shopId} | Cashier: {bill.cashierId}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-6 rounded shadow-md col-span-2">
            <h2 className="text-xl font-semibold mb-4">📊 Sales Visualization</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboard.recentBills.map(b => ({ shopId: b.shopId, total: b.total }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="shopId" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#3182CE" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded shadow-md col-span-2">
            <h2 className="text-xl font-semibold mb-4">🧑‍💼 Vendor Approvals</h2>
            <ul className="divide-y">
              {vendors.map(v => (
                <li key={v._id} className="py-2 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{v.name} ({v.email})</p>
                    {!v.approved && <span className="text-yellow-500 text-sm">Pending Approval</span>}
                  </div>
                  <div className="space-x-2">
                    {!v.approved ? (
                      <>
                        <button
                          onClick={() => approveVendor(v._id)}
                          className="bg-green-500 text-white px-3 py-1 rounded"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectVendor(v._id)}
                          className="bg-red-500 text-white px-3 py-1 rounded"
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
