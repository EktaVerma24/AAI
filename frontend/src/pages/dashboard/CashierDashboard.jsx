import React, { useEffect, useState } from 'react';
import API from '../../utils/api';

const CashierDashboard = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState({ name: '', phone: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get('/products/shop');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products');
    }
  };

  const addToCart = (productId, quantity) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === productId);
      if (existing) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, { productId, quantity }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleBilling = async () => {
    try {
      const res = await API.post('/billing', {
        items: cart,
        customerName: customer.name,
        customerPhone: customer.phone
      });
      setMessage(res.data.msg);
      const backendBase = import.meta.env.VITE_BACKEND_URL;
      setInvoiceUrl(`${backendBase}${res.data.pdfPath}`);
      setCart([]);
      setCustomer({ name: '', phone: '' });
      fetchProducts();
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Billing failed');
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Cashier Dashboard</h1>

      {message && <p className="text-green-600 mb-4">{message}</p>}
      {invoiceUrl && (
        <a
          href={invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          📄 View Invoice
        </a>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search products..."
          className="w-full p-2 border rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {filteredProducts.map((product) => (
          <div
            key={product._id}
            className="bg-white p-4 rounded shadow-md flex justify-between items-center"
          >
            <div>
              <h3 className="font-semibold">{product.name}</h3>
              <p>Price: ₹{product.price}</p>
              <p>Available: {product.quantity}</p>
            </div>
            <button
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              onClick={() => addToCart(product._id, 1)}
              disabled={product.quantity === 0}
            >
              Add 1
            </button>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="bg-white p-6 rounded shadow-md">
          <h2 className="text-xl font-semibold mb-4">🛒 Cart</h2>

          <input
            type="text"
            placeholder="Customer Name"
            className="w-full p-2 border rounded mb-2"
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Customer Phone"
            className="w-full p-2 border rounded mb-4"
            value={customer.phone}
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
          />

          <ul className="divide-y mb-4">
            {cart.map((item, idx) => {
              const product = products.find((p) => p._id === item.productId);
              return (
                <li key={idx} className="py-2 flex justify-between items-center">
                  <span>{product?.name || item.productId} × {item.quantity}</span>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => removeFromCart(item.productId)}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleBilling}
          >
            ✅ Generate Bill
          </button>
        </div>
      )}
    </div>
  );
};

export default CashierDashboard;
