import React, { useEffect, useState } from 'react';
import API from '../../utils/api';

const CashierDashboard = () => {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const [pdfPath, setPdfPath] = useState('');

  const shopId = JSON.parse(localStorage.getItem('cashier'))?.shopId;

  useEffect(() => {
    if (shopId) {
      API.get(`/products/${shopId}`)
        .then(res => setProducts(res.data))
        .catch(() => setMessage('Failed to load products'));
    }
  }, [shopId]);

  const addItem = (productId, name, price) => {
    const qty = parseInt(prompt(`Enter quantity for ${name}:`));
    if (!qty || qty <= 0) return;

    setItems([...items, { productId, quantity: qty, price }]);
  };

  const generateBill = async () => {
    try {
      const res = await API.post('/billing', { items });
      setMessage('✅ Billing successful');
      setPdfPath(res.data.pdfPath);
      setItems([]);
    } catch (err) {
      setMessage(err.response?.data?.msg || 'Billing failed');
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
      <h1 className="text-2xl font-bold text-yellow-700 mb-6">Cashier Dashboard</h1>

      {message && <p className="mb-4 text-green-600">{message}</p>}

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map(p => (
            <div key={p._id} className="p-4 bg-white rounded shadow">
              <h3 className="font-semibold">{p.name}</h3>
              <p>₹{p.price} | Stock: {p.quantity}</p>
              <button
                onClick={() => addItem(p._id, p.name, p.price)}
                className="mt-2 bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
              >
                Add to Bill
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p>No products available</p>
      )}

      {items.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Selected Items:</h2>
          <ul className="mb-4 space-y-1">
            {items.map((item, idx) => (
              <li key={idx}>
                Product ID: {item.productId}, Qty: {item.quantity}
              </li>
            ))}
          </ul>
          <button
            onClick={generateBill}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Generate Bill
          </button>
        </div>
      )}

      {pdfPath && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold">Invoice:</h3>
          <a
            href={`http://localhost:5000${pdfPath}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Download PDF
          </a>
        </div>
      )}
    </div>
  );
};

export default CashierDashboard;
