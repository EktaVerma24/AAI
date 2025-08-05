// src/pages/auth/VendorRegister.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const VendorRegister = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/register', form);

      toast.success('✅ Vendor registered successfully. Awaiting admin approval.');
      
      // redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/vendor/login', { replace: true });
      }, 2000);

    } catch (err) {
      // Use `msg` instead of `message` to match backend
      const msg = err.response?.data?.msg || err.response?.data?.message || '❌ Registration failed';

      if (msg.toLowerCase().includes('exists')) {
        toast.error('❌ Email already exists');
      } else if (msg.toLowerCase().includes('approval') || msg.toLowerCase().includes('under review')) {
        toast.warn('⚠️ Your account is pending approval');
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <form onSubmit={handleRegister} className="bg-white p-8 rounded shadow-md w-80">
        <h2 className="text-2xl font-bold mb-4">Vendor Register</h2>
        <input
          name="name"
          placeholder="Name"
          className="w-full mb-3 p-2 border rounded"
          onChange={handleChange}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-2 border rounded"
          onChange={handleChange}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-2 border rounded"
          onChange={handleChange}
          required
        />
        <button className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700">
          Register
        </button>
      </form>
    </div>
  );
};

export default VendorRegister;
