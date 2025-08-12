// src/pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Professional ActionCard Component
const ActionCard = ({ title, description, icon, color, onClick, buttonText }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:border-gray-300">
    <div className="text-center">
      <div className={`w-16 h-16 ${color} rounded-full flex items-center justify-center mx-auto mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 text-sm leading-relaxed">{description}</p>
      <button
        onClick={onClick}
        className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-md ${color.replace('bg-', 'bg-').replace('hover:bg-', 'hover:bg-')}`}
      >
        {buttonText}
      </button>
    </div>
  </div>
);



const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                Airport Inventory Management
              </h1>
            </div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Streamline your airport retail operations with our comprehensive inventory management system
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <ActionCard
            title="Vendor Portal"
            description="Manage your shops, products,upi qr code and inventory. Monitor sales performance and track business metrics."
            icon={<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>}
            color="bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate('/vendor/login')}
            buttonText="Login as Vendor"
          />

          <ActionCard
            title="Cashier Portal"
            description="Process transactions, manage customer bills, and handle day-to-day sales operations efficiently. Generate bills and manage inventory."
            icon={<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>}
            color="bg-green-600 hover:bg-green-700"
            onClick={() => navigate('/cashier/login')}
            buttonText="Login as Cashier"
          />

          <ActionCard
            title="Admin Portal"
            description="Oversee all operations, manage vendors, monitor system performance, and generate comprehensive reports."
            icon={<svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>}
            color="bg-purple-600 hover:bg-purple-700"
            onClick={() => navigate('/admin/login')}
            buttonText="Login as Admin"
          />
        </div>

        {/* Vendor Registration Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">New to the Platform?</h2>
            <p className="text-gray-600">Join our network of airport vendors and start managing your business efficiently</p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/vendor/register')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all duration-200 hover:shadow-lg transform hover:-translate-y-1"
            >
              Register as Vendor
            </button>
          </div>
        </div>



        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p className="text-sm">
            © 2024 Airport Inventory Management System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
