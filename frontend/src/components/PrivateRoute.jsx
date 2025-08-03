// src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token || role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
