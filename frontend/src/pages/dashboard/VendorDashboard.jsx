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


const VendorDashboard = () => {
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [shopData, setShopData] = useState({ name: '', location: '' });
  const [shopMessage, setShopMessage] = useState('');
  const [product, setProduct] = useState({ name: '', price: '', quantity: '' });
  const [cashier, setCashier] = useState({ name: '', email: '', password: '' });
  const [cashiersByShop, setCashiersByShop] = useState({});
  const [billsByShop, setBillsByShop] = useState({});
  const [productsByShop, setProductsByShop] = useState({});
  const [viewOption, setViewOption] = useState({});
  const [analytics, setAnalytics] = useState({ totalRevenue: 0, productSales: [], salesPerDay: [] });
  const [selectedDate, setSelectedDate] = useState('');
  const [dailyProductSales, setDailyProductSales] = useState([]);

  useEffect(() => {
    fetchShops();
    fetchAnalytics();

    const socket = io(import.meta.env.VITE_BACKEND_URL);
    socket.on('newBill', (data) => {
      console.log('🧾 Real-time Bill Received:', data);
      if (data.shopId) fetchBills(data.shopId);
      fetchAnalytics();
    });

    return () => socket.disconnect();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await API.get('/analytics/vendor');
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics');
    }
  };

  const fetchDailyProductSales = async (date) => {
    try {
      const res = await API.get(`/analytics/vendor/daily-product-sales?date=${date}`);
      setDailyProductSales(res.data);
    } catch (err) {
      console.error('Failed to fetch daily product sales');
    }
  };

  const fetchShops = async () => {
    try {
      const res = await API.get('/shops');
      setShops(res.data);
    } catch (err) {
      console.error('Failed to fetch shops');
    }
  };

  const fetchCashiers = async (shopId) => {
    try {
      const res = await API.get(`/cashiers/${shopId}`);
      setCashiersByShop((prev) => ({ ...prev, [shopId]: res.data }));
    } catch (err) {
      console.error('Failed to fetch cashiers');
    }
  };

  const fetchBills = async (shopId) => {
    try {
      const res = await API.get('/billing/vendor');
      const shopBills = res.data.filter((b) => b.shopId._id === shopId);
      setBillsByShop((prev) => ({ ...prev, [shopId]: shopBills }));
    } catch (err) {
      console.error('Failed to fetch bills');
    }
  };

  const fetchProductsForShop = async (shopId) => {
    try {
      const res = await API.get(`/products/${shopId}`);
      setProductsByShop((prev) => ({ ...prev, [shopId]: res.data }));
    } catch (err) {
      console.error('Failed to fetch products');
    }
  };

  const handleCreateShop = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/shops', shopData);
      setShops([...shops, res.data.shop]);
      setShopData({ name: '', location: '' });
      setShopMessage('✅ Shop created successfully');
    } catch (err) {
      setShopMessage(err.response?.data?.msg || '❌ Failed to create shop');
    }
  };

  const handleProductChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleCashierChange = (e) => {
    setCashier({ ...cashier, [e.target.name]: e.target.value });
  };

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
    } catch (err) {
      alert('❌ Failed to add product');
    }
  };

  const handleAddCashier = async (shopId) => {
    try {
      await API.post('/cashiers', { ...cashier, shopId });
      fetchCashiers(shopId);
      setCashier({ name: '', email: '', password: '' });
    } catch (err) {
      alert('❌ Failed to add cashier');
    }
  };

  const handleRemoveCashier = async (cashierId, shopId) => {
    try {
      await API.delete(`/cashiers/${cashierId}`);
      fetchCashiers(shopId);
    } catch (err) {
      alert('❌ Failed to remove cashier');
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    if (date) fetchDailyProductSales(date);
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

      <h1 className="text-3xl font-bold text-blue-700 mb-6">Vendor Dashboard</h1>

      <div className="bg-white p-6 rounded shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">📊 Sales Analytics</h2>
        <p className="text-lg text-green-700">Total Revenue: ₹{analytics.totalRevenue || 0}</p>

        <div className="mt-4">
          <label className="block mb-2 text-sm font-medium">Select Date for Sales:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="border p-2 rounded"
          />
        </div>

        {dailyProductSales.length > 0 && (
          <div className="mt-4">
            <h3 className="text-md font-semibold mb-2">📆 Sales on {selectedDate}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyProductSales.map(item => ({ name: item.name, quantity: item.quantitySold }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" fill="#3182CE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <h3 className="text-md font-semibold mt-4 mb-2">🔥 Best Selling Products:</h3>
        <ul className="list-disc pl-5">
          {analytics.productSales?.map((item, idx) => (
            <li key={idx}>{item.name} - {item.quantitySold} units</li>
          ))}
        </ul>
      </div>

      <div className="max-w-md bg-white p-6 rounded shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Create Shop</h2>
        <form onSubmit={handleCreateShop} className="space-y-4">
          <input
            type="text"
            name="name"
            placeholder="Shop Name"
            value={shopData.name}
            onChange={(e) => setShopData({ ...shopData, name: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="text"
            name="location"
            placeholder="Terminal / Location"
            value={shopData.location}
            onChange={(e) => setShopData({ ...shopData, location: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Create Shop
          </button>
        </form>
        {shopMessage && <p className="mt-4 text-green-600">{shopMessage}</p>}
      </div>

      {shops.map((shop) => (
        <div key={shop._id} className="bg-white p-6 rounded shadow-md mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold">{shop.name}</h3>
              <p className="text-sm text-gray-500">{shop.location}</p>
            </div>
            <button
              className="text-blue-600 underline"
              onClick={() => {
                setSelectedShopId(selectedShopId === shop._id ? null : shop._id);
                if (!billsByShop[shop._id]) fetchBills(shop._id);
                if (!productsByShop[shop._id]) fetchProductsForShop(shop._id);
                if (!cashiersByShop[shop._id]) fetchCashiers(shop._id);
              }}
            >
              {selectedShopId === shop._id ? 'Close' : 'Manage Shop'}
            </button>
          </div>

          {selectedShopId === shop._id && (
            <div className="mt-6">
              <div className="mb-4 space-x-4">
                <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={() => setViewOption({ [shop._id]: 'product' })}>➕ Add Product</button>
                <button className="bg-purple-500 text-white px-3 py-1 rounded" onClick={() => setViewOption({ [shop._id]: 'cashier' })}>👤 Add Cashier</button>
                <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={() => setViewOption({ [shop._id]: 'bills' })}>🧾 View Bills</button>
                <button className="bg-yellow-500 text-white px-3 py-1 rounded" onClick={() => setViewOption({ [shop._id]: 'products' })}>📦 View Products</button>
              </div>

              {viewOption[shop._id] === 'product' && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-2">Add Product</h4>
                  <input type="text" name="name" placeholder="Product Name" value={product.name} onChange={handleProductChange} className="w-full p-2 border rounded mb-2" />
                  <input type="number" name="price" placeholder="Price" value={product.price} onChange={handleProductChange} className="w-full p-2 border rounded mb-2" />
                  <input type="number" name="quantity" placeholder="Quantity" value={product.quantity} onChange={handleProductChange} className="w-full p-2 border rounded mb-2" />
                  <button onClick={() => handleAddProduct(shop._id)} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Add Product</button>
                </div>
              )}

              {viewOption[shop._id] === 'cashier' && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-2">Add Cashier</h4>
                  <input type="text" name="name" placeholder="Cashier Name" value={cashier.name} onChange={handleCashierChange} className="w-full p-2 border rounded mb-2" />
                  <input type="email" name="email" placeholder="Email" value={cashier.email} onChange={handleCashierChange} className="w-full p-2 border rounded mb-2" />
                  <input type="password" name="password" placeholder="Password" value={cashier.password} onChange={handleCashierChange} className="w-full p-2 border rounded mb-2" />
                  <button onClick={() => handleAddCashier(shop._id)} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">Add Cashier</button>
                  {cashiersByShop[shop._id]?.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-md font-semibold mb-2">Cashiers</h4>
                      <ul className="divide-y">
                        {cashiersByShop[shop._id].map((c) => (
                          <li key={c._id} className="py-2 flex justify-between items-center">
                            <span>{c.name} ({c.email})</span>
                            <button onClick={() => handleRemoveCashier(c._id, shop._id)} className="text-red-600 hover:underline">Remove</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {viewOption[shop._id] === 'bills' && billsByShop[shop._id] && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-2">🧾 Bill Records</h4>
                  <ul className="divide-y">
                    {billsByShop[shop._id].map((b) => (
  <li key={b._id} className="py-2">
    <div><strong>Bill #{b._id.slice(-5)}</strong></div>
    <div>🧾 Total: ₹{b.total} | 📅 {new Date(b.createdAt).toLocaleString()}</div>
    <div>👤 Customer: {b.customerName || 'N/A'}</div>
    <div>👨‍💼 Cashier: {b.cashierId?.name || 'N/A'}</div>
    <div>📦 Products:
      <ul className="list-disc pl-5">
        {b.items?.map((item, idx) => (
          <li key={idx}>
            {item.productId?.name || item.productName || 'Unknown'} × {item.quantity}
          </li>
        ))}
      </ul>
    </div>
    <div>
      <a
        href={`${import.meta.env.VITE_BACKEND_URL}${b.pdfPath}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline"
      >
        View PDF
      </a>
    </div>
  </li>
))}

                  </ul>
                </div>
              )}

              {viewOption[shop._id] === 'products' && productsByShop[shop._id] && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold mb-2">📦 Products</h4>
                  <ul className="divide-y">
                    {productsByShop[shop._id].map((p) => (
                      <li key={p._id} className="py-1">
                        {p.name} - ₹{p.price} (Qty: {p.quantity})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default VendorDashboard;
