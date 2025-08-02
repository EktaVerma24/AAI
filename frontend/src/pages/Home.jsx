// src/pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-gray-200">
      <h1 className="text-3xl md:text-4xl font-bold mb-10 text-blue-700">
        ✈️ Airport Inventory Management
      </h1>

      <div className="space-y-4 w-72">
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => navigate('/vendor/login')}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Login as Vendor
          </button>
          <button
            onClick={() => navigate('/vendor/register')}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Register as Vendor
          </button>
        </div>

        <button
          onClick={() => navigate('/cashier/login')}
          className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
        >
          Login as Cashier
        </button>

        <button
          onClick={() => navigate('/admin/login')}
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
        >
          Login as Admin
        </button>
      </div>
    </div>
  );
};

export default Home;
