import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VendorLogin from './pages/auth/VendorLogin';
import VendorRegister from './pages/auth/VendorRegister';
import CashierLogin from './pages/auth/CashierLogin';
import AdminLogin from './pages/auth/AdminLogin';
import VendorDashboard from './pages/dashboard/VendorDashboard';
import CashierDashboard from './pages/dashboard/CashierDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import Home from './pages/Home';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Protected Dashboards */}
        <Route
          path="/vendor/dashboard"
          element={
            <PrivateRoute allowedRole="vendor">
              <VendorDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/cashier/dashboard"
          element={
            <PrivateRoute allowedRole="cashier">
              <CashierDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute allowedRole="admin">
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* Auth Routes */}
        <Route path="/vendor/login" element={<VendorLogin />} />
        <Route path="/vendor/register" element={<VendorRegister />} />
        <Route path="/cashier/login" element={<CashierLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
      </Routes>
    </Router>
  );
}

export default App;
