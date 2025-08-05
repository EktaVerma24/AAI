import React, { useEffect, useState } from 'react';
import API from '../../utils/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CashierDashboard = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [billHistory, setBillHistory] = useState([]);
  const [showAllBills , setShowAllBills] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);


  useEffect(() => {
    fetchProducts();
    fetchBillHistory();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await API.get('/products/shop');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products');
    }
  };

  const fetchBillHistory = async () => {
    try {
      const res = await API.get('/billing/cashier');
      setBillHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch billing history');
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

    setCart((prev) => {
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
    const name = customer.name.trim();
    const phone = customer.phone.trim();

    if (!name) {
      toast.error("❌ Customer name is required.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      toast.error("❌ Customer phone must be exactly 10 digits.");
      return;
    }

    if (cart.length === 0) {
      toast.error("❌ Your cart is empty.");
      return;
    }
    setIsGenerating(true);

    try {
      const res = await API.post('/billing', {
        items: cart,
        customerName: name,
        customerPhone: phone,
      });

      toast.success("✅ Bill generated successfully!");
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
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen relative p-8 bg-gray-100">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      <button
        className="absolute top-4 right-6 bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
        onClick={() => {
          localStorage.clear();
          window.location.href = '/';
        }}
      >
        Logout
      </button>

      <h1 className="text-3xl font-bold text-blue-700 mb-6">Cashier Dashboard</h1>

      {message && <p className="text-green-600 mb-4">{message}</p>}
      {invoiceUrl && (
        <a
          href={invoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline block mb-4"
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
        {filteredProducts.map((product) => {
          const cartItem = cart.find((item) => item.productId === product._id);
          return (
            <div
              key={product._id}
              className="bg-white p-4 rounded shadow-md flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">{product.name}</h3>
                <p>Price: ₹{product.price}</p>
                <p>Available: {product.quantity}</p>
              </div>
              <div className="space-x-2">
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  onClick={() => addToCart(product._id, 1)}
                >
                  Add 1
                </button>
                {cartItem && (
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
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

      {cart.length > 0 && (
        <div className="bg-white p-6 rounded shadow-md">
          <h2 className="text-xl font-semibold mb-4">🛒 Cart</h2>

          <input
            type="text"
            placeholder="Customer Name"
            className="w-full p-2 border rounded mb-2"
            required
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
          />
          <input
            type="tel"
            placeholder="Customer Phone"
            className="w-full p-2 border rounded mb-4"
            required
            pattern="[0-9]{10}"
            maxLength={10}
            inputMode="numeric"
            value={customer.phone}
            onChange={(e) =>
              setCustomer({ ...customer, phone: e.target.value.replace(/\D/g, '') })
            }
          />

          <ul className="divide-y mb-4">
            {cart.map((item, idx) => {
              const product = products.find((p) => p._id === item.productId);
              return (
                <li key={idx} className="py-2 flex justify-between items-center">
                  <span>
                    {product?.name || item.productId} × {item.quantity}
                  </span>
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

          {isGenerating ? (
  <button
    className="bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed"
    disabled
  >
    ⏳ Generating Bill...
  </button>
) : (
  <button
    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    onClick={handleBilling}
  >
    ✅ Generate Bill
  </button>
)}

        </div>
      )}

      {billHistory.length > 0 && (
        <div className="mt-12 bg-white p-6 rounded shadow-md">
          <h2 className="text-xl font-semibold mb-4">🧾 Billing History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border">Bill ID</th>
                  <th className="px-4 py-2 border">Customer</th>
                  <th className="px-4 py-2 border">Date</th>
                  <th className="px-4 py-2 border">Total</th>
                  <th className="px-4 py-2 border">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {(showAllBills ? billHistory : billHistory.slice(0, 5)).map((bill) => (
                  <tr key={bill._id}>
                    <td className="px-4 py-2 border">{bill._id.slice(-5)}</td>
                    <td className="px-4 py-2 border">{bill.customerName || 'N/A'}</td>
                    <td className="px-4 py-2 border">
                      {new Date(bill.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 border">₹{bill.total}</td>
                    <td className="px-4 py-2 border text-blue-600 underline">
                      <a
                        href={`${import.meta.env.VITE_BACKEND_URL}${bill.pdfPath}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {billHistory.length > 5 && (
  <div className="mt-4 text-center">
    <button
      className="text-blue-600 underline"
      onClick={() => setShowAllBills((prev) => !prev)}
    >
      {showAllBills ? 'View Less ▲' : 'View More ▼'}
    </button>
  </div>
)}

          </div>
        </div>
      )}
    </div>
  );
};

export default CashierDashboard;
