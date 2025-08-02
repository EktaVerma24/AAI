import React, { useState, useEffect } from 'react';
import API from '../../utils/api';

const VendorDashboard = () => {
  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [shopData, setShopData] = useState({ name: '', location: '' });
  const [shopMessage, setShopMessage] = useState('');

  const [product, setProduct] = useState({ name: '', price: '', quantity: '' });
  const [cashier, setCashier] = useState({ name: '', email: '', password: '' });
  const [messages, setMessages] = useState({});
  const [cashiersByShop, setCashiersByShop] = useState({});

  useEffect(() => {
    fetchShops();
  }, []);

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
      const res = await API.post('/products', {
        ...product,
        price: Number(product.price),
        quantity: Number(product.quantity),
        shopId
      });
      setMessages((prev) => ({ ...prev, [shopId]: '✅ Product added successfully' }));
      setProduct({ name: '', price: '', quantity: '' });
    } catch (err) {
      setMessages((prev) => ({ ...prev, [shopId]: err.response?.data?.msg || '❌ Failed to add product' }));
    }
  };

  const handleAddCashier = async (shopId) => {
    try {
      await API.post('/cashiers', { ...cashier, shopId });
      fetchCashiers(shopId);
      setMessages((prev) => ({ ...prev, ['cashier-' + shopId]: '✅ Cashier added successfully' }));
      setCashier({ name: '', email: '', password: '' });
    } catch (err) {
      setMessages((prev) => ({ ...prev, ['cashier-' + shopId]: err.response?.data?.msg || '❌ Failed to add cashier' }));
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

      {/* Create Shop */}
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
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Create Shop
          </button>
        </form>
        {shopMessage && <p className="mt-4 text-green-600">{shopMessage}</p>}
      </div>

      {/* List of Shops */}
      <div className="space-y-6">
        {shops.map((s) => (
          <div key={s._id} className="bg-white p-6 rounded shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-semibold">{s.name}</h3>
                <p className="text-sm text-gray-500">{s.location}</p>
              </div>
              <button
                className="text-blue-600 underline"
                onClick={() => {
                  if (selectedShopId === s._id) {
                    setSelectedShopId(null);
                  } else {
                    setSelectedShopId(s._id);
                    fetchCashiers(s._id);
                  }
                }}
              >
                {selectedShopId === s._id ? 'Close' : 'Manage'}
              </button>
            </div>

            {selectedShopId === s._id && (
              <div className="mt-6 space-y-6">
                {/* Add Product */}
                <div>
                  <h4 className="text-lg font-semibold mb-2">Add Product</h4>
                  <input
                    type="text"
                    name="name"
                    placeholder="Product Name"
                    value={product.name || ''}
                    onChange={handleProductChange}
                    className="w-full p-2 border rounded mb-2"
                  />
                  <input
                    type="number"
                    name="price"
                    placeholder="Price"
                    value={product.price || ''}
                    onChange={handleProductChange}
                    className="w-full p-2 border rounded mb-2"
                  />
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Quantity"
                    value={product.quantity || ''}
                    onChange={handleProductChange}
                    className="w-full p-2 border rounded mb-2"
                  />
                  <button
                    onClick={() => handleAddProduct(s._id)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Add Product
                  </button>
                  {messages[s._id] && <p className="text-green-600 mt-2">{messages[s._id]}</p>}
                </div>

                {/* Add Cashier */}
                <div>
                  <h4 className="text-lg font-semibold mb-2">Add Cashier</h4>
                  <input
                    type="text"
                    name="name"
                    placeholder="Cashier Name"
                    value={cashier.name || ''}
                    onChange={handleCashierChange}
                    className="w-full p-2 border rounded mb-2"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={cashier.email || ''}
                    onChange={handleCashierChange}
                    className="w-full p-2 border rounded mb-2"
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={cashier.password || ''}
                    onChange={handleCashierChange}
                    className="w-full p-2 border rounded mb-2"
                  />
                  <button
                    onClick={() => handleAddCashier(s._id)}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
                  >
                    Add Cashier
                  </button>
                  {messages['cashier-' + s._id] && <p className="text-green-600 mt-2">{messages['cashier-' + s._id]}</p>}
                </div>

                {/* Cashier List */}
                {cashiersByShop[s._id]?.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mt-4 mb-2">Cashiers</h4>
                    <ul className="divide-y">
                      {cashiersByShop[s._id].map((c) => (
                        <li key={c._id} className="py-2 flex justify-between items-center">
                          <span>{c.name} ({c.email})</span>
                          <button
                            onClick={() => handleRemoveCashier(c._id, s._id)}
                            className="text-red-600 hover:underline"
                          >
                            Remove
                          </button>
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
    </div>
  );
};

export default VendorDashboard;
