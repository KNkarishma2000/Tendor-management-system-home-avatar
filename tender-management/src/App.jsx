import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';


import Login from './pages/auth/Login';
import LoginSupplier from './pages/auth/LoginSupplier';
import RegisterResident from './pages/auth/ResidentRegister';
import RegisterSupplier from './pages/auth/SupplierRegister';
import ResidentManagement from './pages/admin/resident';

import AdminDashboard from './pages/dashboard/AdminDashboard';
import Carnivals from './pages/admin/Carnivals';
import NoticeManagement from './pages/admin/NoticeManagement';
import TenderManagement from './pages/admin/TenderManagement';
import TenderDetails from './pages/admin/TenderDetails';
import CreateTender from './pages/admin/CreateTender';
import SupplierDirectory from './pages/admin/SupplierManagement';



function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicLayout />} />
      <Route path="/login" element={<Login />} />
      <Route path="/supplier-login" element={<LoginSupplier />} />
      <Route path="/resident-register" element={<RegisterResident />} />
      <Route path="/supplier-register" element={<RegisterSupplier />} />

      {/* Admin Dashboard Routes */}
      <Route path="/admin" element={<DashboardLayout />}>
        {/* Redirect /admin to /admin/dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />
        
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="carnivals" element={<Carnivals />} />
        <Route path="residents" element={<ResidentManagement />} /> 
        <Route path="notices" element={<NoticeManagement />} /> 
         <Route path="suppliers" element={<SupplierDirectory />} /> 
         // Example Route setup
<Route path="/admin/supplier/:id" element={<SupplierProfilePage />} />
           <Route path="tenders" element={<TenderManagement />} /> 
           <Route path="tenders/:id" element={<TenderDetails />} />
             <Route path="tenders/create" element={<CreateTender />} />
             <Route path="tenders/edit/:id" element={<CreateTender />} />
             
      </Route>

      {/* Fallback */}
      <Route path="*" element={<div className="p-10 font-black text-center">404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;