import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';


import Login from './pages/auth/Login';
import LoginSupplier from './pages/auth/LoginSupplier';
import RegisterResident from './pages/auth/ResidentRegister';
import RegisterSupplier from './pages/auth/SupplierRegister';
import ResidentManagement from './pages/admin/Resident';

import AdminDashboard from './pages/dashboard/AdminDashboard';
import Carnivals from './pages/admin/Carnivals';
import NoticeManagement from './pages/admin/NoticeManagement';
import TenderManagement from './pages/admin/TenderManagement';
import TenderDetails from './pages/admin/TenderDetails';
import CreateTender from './pages/admin/CreateTender';
import SupplierDirectory from './pages/admin/SupplierManagement';
import ResidentDashboard from './pages/dashboard/ResidentDashboard';
import CreateListing from './pages/community/Marketplace';
import ResidentBlogs from './pages/community/blogs';
import ResidentGallery from './pages/community/ResidentGallery';
import SupplierDashboard from './pages/dashboard/SupplierDashboard';
import AvailableTenders from './pages/tenders/TenderList';
import BidSubmissionPage from './pages/tenders/BidSubmission';
import SupplierTenderPortal from './pages/tenders/SupplierTenderPortal';
import PublicTenderList from './layouts/PublicListTenders';
import PublicTenderDetails from './layouts/TenderDetails';
import AllCarnivals from './layouts/AllCarnivals';
import AllBlogs from './layouts/Allblogs';
import BlogDetails from './layouts/BlogDetails';
import AllGallery from './layouts/AllGallery';



function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicLayout />} />
      <Route path="/login" element={<Login />} />
      <Route path="/tenders" element={<PublicTenderList />} />
      <Route path="/supplier-login" element={<LoginSupplier />} />
       <Route path="/gallery" element={<AllGallery />} />
            <Route path="/carnivals" element={<AllCarnivals />} />
      <Route path="/resident-register" element={<RegisterResident />} />
      <Route path="/supplier-register" element={<RegisterSupplier />} />
     <Route path="/tenders/:id" element={<PublicTenderDetails />} />
        <Route path="/blog" element={<AllBlogs />} />
            <Route path="/blog/:id" element={<BlogDetails />} />
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

           <Route path="tenders" element={<TenderManagement />} /> 
           <Route path="tenders/:id" element={<TenderDetails />} />
             <Route path="tenders/create" element={<CreateTender />} />
             <Route path="tenders/edit/:id" element={<CreateTender />} />
             
      </Route>
      {/* RESIDENT ROUTES */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Navigate to="resident" replace />} />
                <Route path="marketplace" element={<CreateListing />} />
                    <Route path="blogs" element={<ResidentBlogs />} />
                           <Route path="gallery" element={<ResidentGallery />} />
        <Route path="resident" element={<ResidentDashboard />} />
        {/* Add these as you build them:
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="events" element={<CommunityEvents />} /> 
        */}
      </Route>
      {/* SUPPLIER ROUTES */}
<Route path="/supplier" element={<DashboardLayout />}>
    <Route index element={<Navigate to="portal" replace />} />
    <Route path="portal" element={<SupplierDashboard />} />
    <Route path="tender" element={<AvailableTenders />} />
      <Route path="bids" element={<BidSubmissionPage />} />
    {/* This is the key connection point */}
    <Route path="tender/:id" element={<SupplierTenderPortal />} />
</Route>

      {/* Fallback */}
      <Route path="*" element={<div className="p-10 font-black text-center">404 - Page Not Found</div>} />
    </Routes>
  );
}

export default App;