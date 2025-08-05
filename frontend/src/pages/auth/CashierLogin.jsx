// src/pages/auth/CashierLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';

const CashierLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/cashier/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', 'cashier');
      localStorage.setItem('cashier', JSON.stringify(res.data.cashier));

      navigate('/cashier/dashboard',{replace: true});
    } catch (err) {
      alert(err.response?.data?.msg || 'Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-4">Cashier Login</h2>
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="w-full bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600">
          Login
        </button>
      </form>
    </div>
  );
};

export default CashierLogin;
