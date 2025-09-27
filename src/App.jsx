import React, { useEffect, useState, useMemo, Suspense } from 'react';

// --- FIREBASE IMPORTS ---
import { db, auth } from './firebase';
import { ref, set, update, remove, push, onValue, query, orderByChild, equalTo, get } from 'firebase/database';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

// --- TOASTIFY IMPORTS ---
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css'

// --- SVG ICONS (Corrected viewBox) ---
const Users = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const Truck = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" /><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" /><circle cx="7.5" cy="18.5" r="2.5" /><circle cx="17.5" cy="18.5" r="2.5" /></svg>;
const Package = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" /><path d="M12 15H3l-1-5L2 2h20l-1 8h-9" /><path d="m9.5 9.4 1.35 1.35a.5.5 0 0 0 .7 0L13 9.4" /></svg>;
const Clock = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const CheckCircle = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const XCircle = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>;
const AlertTriangle = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>;
const X = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const Loader = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>;
const Printer = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>;
const SignOutIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;
const Ban = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></svg>;
const RefreshCw = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>;
const Trash2 = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>;


// --- Helper Functions ---
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const firebaseObjectToArray = (snapshot) => {
  const data = snapshot.val();
  return data ? Object.keys(data).map(key => ({ id: key, ...data[key] })).sort((a, b) => (b.timestamp || b.createdAt || 0) - (a.timestamp || a.createdAt || 0)) : [];
};

const isToday = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

// --- Reusable UI Components ---
const DashboardCard = ({ title, value, icon, color, onClick }) => (
  <div onClick={onClick} className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4 cursor-pointer hover:shadow-lg hover:scale-105 transition-transform duration-200 ease-in-out">
    <div className={`p-3 rounded-full ${color}`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[70]">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
            <div className="mt-2"><p className="text-sm text-gray-500">{message}</p></div>
          </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm" onClick={onConfirm}>Confirm</button>
          <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const ImageModal = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[60] p-4" onClick={onClose}>
      <div className="relative">
        <img src={src} alt="Preview" className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()} />
        <button onClick={onClose} className="absolute -top-4 -right-4 text-white bg-gray-800 rounded-full p-2 hover:bg-gray-700">
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

const TabButton = ({ id, label, activeTab, setActiveTab }) => (
  <button onClick={() => setActiveTab(id)} className={`px-4 py-2 font-medium text-sm rounded-md whitespace-nowrap ${activeTab === id ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>
    {label}
  </button>
);

// --- Dashboard Content Components ---
const DashboardContent = ({ users, vendors, wasteEntries, setActiveTab }) => {
  const stats = useMemo(() => {
    const pendingAssignments = wasteEntries.filter(w => !w.isAssigned).length;
    const todaysOrders = wasteEntries.filter(w => isToday(w.timestamp)).length;
    const totalUsers = users.length;
    const activeVendors = vendors.filter(v => v.status === 'approved').length;
    return { pendingAssignments, todaysOrders, totalUsers, activeVendors };
  }, [users, vendors, wasteEntries]);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Live Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Pending Assignments" value={stats.pendingAssignments} icon={<Clock className="w-6 h-6 text-white" />} color="bg-yellow-500" onClick={() => setActiveTab('assignment')} />
        <DashboardCard title="Today's Orders" value={stats.todaysOrders} icon={<Package className="w-6 h-6 text-white" />} color="bg-blue-500" onClick={() => setActiveTab('assignment')} />
        <DashboardCard title="Active Vendors" value={stats.activeVendors} icon={<Truck className="w-6 h-6 text-white" />} color="bg-green-500" onClick={() => setActiveTab('verification')} />
        <DashboardCard title="Total Users" value={stats.totalUsers} icon={<Users className="w-6 h-6 text-white" />} color="bg-purple-500" onClick={() => setActiveTab('users')} />
      </div>
    </div>
  );
};

const UserManagementContent = ({ users, toggleUserStatus, openDeleteModal, processingId }) => (
  <div>
    <h2 className="text-2xl font-semibold text-gray-800 mb-6">User Management</h2>
    <div className="bg-white rounded-lg shadow-md overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">Name</th>
            <th scope="col" className="px-6 py-3">Phone</th>
            <th scope="col" className="px-6 py-3">Email</th>
            <th scope="col" className="px-6 py-3">Status</th>
            <th scope="col" className="px-6 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{user.name || 'N/A'}</td>
              <td className="px-6 py-4">{user.phone}</td>
              <td className="px-6 py-4">{user.email || 'N/A'}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.Status?.toLowerCase() === 'blocked' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {user.Status || 'Active'}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex justify-center items-center space-x-2">
                  <button onClick={() => toggleUserStatus(user)} disabled={processingId === user.id} className={`flex items-center justify-center w-20 px-3 py-2 text-xs font-medium text-white rounded-md disabled:bg-gray-400 ${user.Status?.toLowerCase() === 'blocked' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}>
                    {processingId === user.id ? <Loader className="w-4 h-4 animate-spin" /> : (user.Status?.toLowerCase() === 'blocked' ? 'Unblock' : 'Block')}
                  </button>
                  <button onClick={() => openDeleteModal(user)} disabled={processingId === user.id} className="p-2 text-red-600 bg-red-100 rounded-md hover:bg-red-200 disabled:bg-gray-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const VendorDetailModal = ({ vendor, onClose, onUpdateStatus, onDelete, setSelectedImage, processingId }) => {
  if (!vendor) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto my-8 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
          <h3 className="text-xl font-bold text-gray-800">{vendor.name}</h3>
          <p className="text-sm text-gray-500">{vendor.phone}</p>
        </div>
        <div className="p-6 border-t border-gray-200 bg-gray-50 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div><p className="font-semibold text-gray-700">Location:</p><p className="text-gray-600">{vendor.location}</p></div>
            <div><p className="font-semibold text-gray-700">Aadhaar:</p><p className="text-gray-600">{vendor.aadhaar}</p></div>
            <div><p className="font-semibold text-gray-700">PAN:</p><p className="text-gray-600">{vendor.pan}</p></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <img src={vendor.aadhaarPhotoURL} alt="Aadhaar" className="w-full h-auto rounded-lg shadow cursor-pointer" onClick={() => setSelectedImage(vendor.aadhaarPhotoURL)} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x250/e2e8f0/334155?text=Aadhaar+Not+Found'; }} />
            <img src={vendor.panPhotoURL} alt="PAN" className="w-full h-auto rounded-lg shadow cursor-pointer" onClick={() => setSelectedImage(vendor.panPhotoURL)} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x250/e2e8f0/334155?text=PAN+Not+Found'; }} />
            <img src={vendor.licensePhotoURL} alt="License" className="w-full h-auto rounded-lg shadow cursor-pointer" onClick={() => setSelectedImage(vendor.licensePhotoURL)} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x250/e2e8f0/334155?text=License+Not+Found'; }} />
          </div>
        </div>
        <div className="p-4 bg-gray-100 flex justify-end items-center space-x-3">
          {vendor.status === 'pending' && <>
            <button onClick={() => onUpdateStatus(vendor.id, 'rejected')} disabled={processingId === vendor.id} className="flex items-center justify-center w-24 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400">{processingId === vendor.id ? <Loader className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-2" /> Reject</>}</button>
            <button onClick={() => onUpdateStatus(vendor.id, 'approved')} disabled={processingId === vendor.id} className="flex items-center justify-center w-28 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400">{processingId === vendor.id ? <Loader className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" /> Approve</>}</button>
          </>}
          {vendor.status === 'approved' && <button onClick={() => onUpdateStatus(vendor.id, 'blocked')} disabled={processingId === vendor.id} className="flex items-center justify-center w-24 px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-lg hover:bg-gray-800 disabled:bg-gray-400">{processingId === vendor.id ? <Loader className="w-4 h-4 animate-spin" /> : <><Ban className="w-4 h-4 mr-2" /> Block</>}</button>}
          {vendor.status === 'blocked' && <button onClick={() => onUpdateStatus(vendor.id, 'approved')} disabled={processingId === vendor.id} className="flex items-center justify-center w-28 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400">{processingId === vendor.id ? <Loader className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" /> Unblock</>}</button>}
          <button onClick={() => onDelete(vendor)} disabled={processingId === vendor.id} className="p-2.5 text-red-600 bg-red-100 rounded-lg hover:bg-red-200 disabled:bg-gray-400"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
};

const VendorVerificationContent = ({ vendors, openVendorDetailModal, activeVendorTab, setActiveVendorTab }) => {
  const [pendingVendors, approvedVendors, rejectedVendors, blockedVendors] = useMemo(() => [
    vendors.filter(v => v.status === 'pending'),
    vendors.filter(v => v.status === 'approved'),
    vendors.filter(v => v.status === 'rejected'),
    vendors.filter(v => v.status === 'blocked')
  ], [vendors]);

  const VendorList = ({ vendors }) => (
    <div className="space-y-3">
      {vendors.length > 0 ? (vendors.map(v => (
        <button key={v.id} onClick={() => openVendorDetailModal(v)} className="w-full text-left p-4 bg-white rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-800">{v.name}</p>
              <p className="text-sm text-gray-600">{v.phone} &middot; {v.location}</p>
            </div>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${v.status === 'approved' ? 'bg-green-100 text-green-800' :
              v.status === 'rejected' ? 'bg-red-100 text-red-800' :
                v.status === 'blocked' ? 'bg-gray-200 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'}`
            }>{v.status}</span>
          </div>
        </button>
      ))) : (<div className="text-center py-12 bg-white rounded-lg shadow-sm"><p className="text-gray-500">No vendors in this category.</p></div>)}
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Vendor Verification</h2>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-2 sm:space-x-6 overflow-x-auto" aria-label="Tabs">
          <button onClick={() => setActiveVendorTab('pending')} className={`${activeVendorTab === 'pending' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Pending <span className="bg-yellow-100 text-yellow-800 ml-2 px-2 py-0.5 rounded-full text-xs">{pendingVendors.length}</span></button>
          <button onClick={() => setActiveVendorTab('approved')} className={`${activeVendorTab === 'approved' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Approved <span className="bg-green-100 text-green-800 ml-2 px-2 py-0.5 rounded-full text-xs">{approvedVendors.length}</span></button>
          <button onClick={() => setActiveVendorTab('rejected')} className={`${activeVendorTab === 'rejected' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Rejected <span className="bg-red-100 text-red-800 ml-2 px-2 py-0.5 rounded-full text-xs">{rejectedVendors.length}</span></button>
          <button onClick={() => setActiveVendorTab('blocked')} className={`${activeVendorTab === 'blocked' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Blocked <span className="bg-gray-200 text-gray-800 ml-2 px-2 py-0.5 rounded-full text-xs">{blockedVendors.length}</span></button>
        </nav>
      </div>
      <div className="mt-6">
        {activeVendorTab === 'pending' && <VendorList vendors={pendingVendors} />}
        {activeVendorTab === 'approved' && <VendorList vendors={approvedVendors} />}
        {activeVendorTab === 'rejected' && <VendorList vendors={rejectedVendors} />}
        {activeVendorTab === 'blocked' && <VendorList vendors={blockedVendors} />}
      </div>
    </div>
  );
};

const AssignmentContent = ({ users, groupedUnassignedEntries, approvedVendors, assignments, setAssignments, confirmGroupAssignment, processingId }) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Assign New Orders</h2>
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr><th scope="col" className="px-6 py-3">Customer</th><th scope="col" className="px-6 py-3">Location</th><th scope="col" className="px-6 py-3">Items</th><th scope="col" className="px-6 py-3">Assign Vendor</th><th scope="col" className="px-6 py-3">Action</th></tr>
          </thead>
          <tbody>
            {Object.entries(groupedUnassignedEntries).map(([mobile, entries]) => {
              const user = users.find(u => u.phone === mobile);
              if (!user) return null;
              const recommendedVendors = approvedVendors.filter(v => v.location?.toLowerCase() === user.location?.toLowerCase());
              const otherVendors = approvedVendors.filter(v => v.location?.toLowerCase() !== user.location?.toLowerCase());
              return (
                <tr key={mobile} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">{user.name || 'N/A'}<br /><span className="font-normal text-gray-500">{mobile}</span></td>
                  <td className="px-6 py-4">{user.location}</td>
                  <td className="px-6 py-4"><ul className="list-disc list-inside space-y-1">{entries.map((entry) => (<li key={entry.id}>{entry.name} - {entry.quantity} {entry.unit}</li>))}</ul></td>
                  <td className="px-6 py-4">
                    <select value={assignments[mobile] || ''} onChange={(e) => setAssignments(prev => ({ ...prev, [mobile]: e.target.value }))} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                      <option value="">-- Select a Vendor --</option>
                      {recommendedVendors.length > 0 && <optgroup label={`Recommended for ${user.location}`}>{recommendedVendors.map(v => (<option key={v.id} value={v.id}>{v.name}</option>))}</optgroup>}
                      {otherVendors.length > 0 && <optgroup label="Other Vendors">{otherVendors.map(v => (<option key={v.id} value={v.id}>{v.name} - {v.location || 'N/A'}</option>))}</optgroup>}
                    </select>
                  </td>
                  <td className="px-6 py-4"><button onClick={() => confirmGroupAssignment(mobile)} disabled={!assignments[mobile] || processingId === mobile} className="flex items-center justify-center w-full sm:w-28 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">{processingId === mobile ? <Loader className="w-5 h-5 animate-spin" /> : 'Confirm'}</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {Object.keys(groupedUnassignedEntries).length === 0 && (<p className="p-6 text-center text-gray-500">No new orders to assign.</p>)}
      </div>
    </div>
  );
};

const ItemManagementContent = ({ items, newItem, setNewItem, handleInputChange, handleItemSubmit, isEditing, processingId, setProcessingId, handleEditItem, openDeleteModal, cancelEdit }) => {
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [showUnitSuggestions, setShowUnitSuggestions] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [sourceLocation, setSourceLocation] = useState('');
  const uniqueCategories = useMemo(() => [...new Set(items.map(item => item.category))], [items]);
  const uniqueUnits = useMemo(() => [...new Set(items.map(item => item.unit))], [items]);
  const uniqueLocations = useMemo(() => [...new Set(items.map(item => item.location))].filter(Boolean), [items]);

  const handleCopyLocation = async () => {
    if (!sourceLocation || !newLocation) return toast.info('Please select a source and provide a new location name.');
    if (uniqueLocations.includes(newLocation)) return toast.error('This location name already exists.');

    setProcessingId('copy-location');
    try {
      const itemsToCopy = items.filter(item => item.location === sourceLocation);
      const copyPromises = itemsToCopy.map(item => {
        const { id, ...rest } = item;
        return set(push(ref(db, 'items')), { ...rest, location: newLocation });
      });
      await Promise.all(copyPromises);
      toast.success(`Successfully copied ${itemsToCopy.length} items to ${newLocation}.`);
      setSourceLocation('');
      setNewLocation('');
    } catch (error) { toast.error('Failed to copy items.'); }
    finally { setProcessingId(null); }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Item Management</h2>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Copy Items to New Location</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <select value={sourceLocation} onChange={(e) => setSourceLocation(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
            <option value="">-- Select Source Location --</option>
            {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
          <input value={newLocation} onChange={(e) => setNewLocation(e.target.value)} placeholder="New Location Name" className="w-full p-2 border border-gray-300 rounded-md" />
          <button onClick={handleCopyLocation} disabled={processingId === 'copy-location'} className="w-full md:w-auto flex justify-center items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400">{processingId === 'copy-location' ? <Loader className="w-5 h-5 animate-spin" /> : 'Copy Items'}</button>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{isEditing ? 'Edit Item' : 'Create New Item'}</h3>
        <form onSubmit={handleItemSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
          <input name="name" value={newItem.name} placeholder="Name" onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md" required />
          <input name="rate" value={newItem.rate} placeholder="Rate" onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md" type="number" required />
          <div className="relative">
            <input name="unit" value={newItem.unit} placeholder="Unit (e.g., kg, item)" onChange={handleInputChange} onFocus={() => setShowUnitSuggestions(true)} onBlur={() => setTimeout(() => setShowUnitSuggestions(false), 150)} className="w-full p-2 border border-gray-300 rounded-md" required />
            {showUnitSuggestions && uniqueUnits.length > 0 && (<ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">{uniqueUnits.map(unit => (<li key={unit} onMouseDown={() => { setNewItem(prev => ({ ...prev, unit })); setShowUnitSuggestions(false); }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">{unit}</li>))}</ul>)}
          </div>
          <div className="relative">
            <input name="category" value={newItem.category} placeholder="Category" onChange={handleInputChange} onFocus={() => setShowCategorySuggestions(true)} onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 150)} className="w-full p-2 border border-gray-300 rounded-md" required />
            {showCategorySuggestions && uniqueCategories.length > 0 && (<ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">{uniqueCategories.map(cat => (<li key={cat} onMouseDown={() => { setNewItem(prev => ({ ...prev, category: cat })); setShowCategorySuggestions(false); }} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">{cat}</li>))}</ul>)}
          </div>
          <input name="location" value={newItem.location} placeholder="Location" onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md" required />
          <input name="imageUrl" value={newItem.imageUrl} placeholder="Image URL or ID" onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md" />
          <div className="flex items-center space-x-2 md:col-span-2 lg:col-span-3 xl:col-span-1">
            <button type="submit" disabled={!!processingId} className="flex-grow flex justify-center items-center px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400">{!!processingId ? <Loader className="w-5 h-5 animate-spin" /> : (isEditing ? 'Update' : 'Add Item')}</button>
            {isEditing && (<button type="button" onClick={cancelEdit} className="flex-shrink-0 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>)}
          </div>
        </form>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th scope="col" className="px-6 py-3">Image</th><th scope="col" className="px-6 py-3">Name</th><th scope="col" className="px-6 py-3">Rate</th><th scope="col" className="px-6 py-3">Unit</th><th scope="col" className="px-6 py-3">Category</th><th scope="col" className="px-6 py-3">Location</th><th scope="col" className="px-6 py-3">Actions</th></tr></thead>
          <tbody>{items.map(item => (<tr key={item.id} className="bg-white border-b hover:bg-gray-50"><td className="px-6 py-4"><img src={item.imageUrl || 'https://placehold.co/100x100/e2e8f0/334155?text=No+Image'} alt={item.name} className="w-16 h-16 object-cover rounded-md" /></td><td className="px-6 py-4 font-medium text-gray-900">{item.name}</td><td className="px-6 py-4">₹{item.rate}</td><td className="px-6 py-4">{item.unit}</td><td className="px-6 py-4">{item.category}</td><td className="px-6 py-4">{item.location}</td><td className="px-6 py-4 flex space-x-2"><button onClick={() => handleEditItem(item)} className="font-medium text-indigo-600 hover:underline">Edit</button><button onClick={() => openDeleteModal(item)} className="font-medium text-red-600 hover:underline">Delete</button></td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}

const BillModal = ({ bill, onClose }) => {
  if (!bill) return null;
  const billItemsArray = bill.billItems ? (Array.isArray(bill.billItems) ? bill.billItems : Object.values(bill.billItems)) : [];

  const handlePrint = () => {
    const printContent = document.getElementById('bill-to-print').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Print Bill</title>');
    printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
    printWindow.document.write('</head><body class="p-4">');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-auto">
        <div id="bill-to-print" className="p-6">
          <h3 className="text-2xl font-bold text-center mb-4">Tax Invoice</h3>
          <div className="grid grid-cols-2 gap-4 text-sm mb-6 pb-6 border-b">
            <div>
              <p className="font-semibold">Billed To:</p>
              <p>{bill.user?.name || 'N/A'}</p>
              <p>{bill.user?.address || 'No address provided'}</p>
              <p>{bill.user?.phone}</p>
              <p>{bill.user?.email || 'No email provided'}</p>
            </div>
            <div className="text-right"><p className="font-semibold">Collected By:</p><p>{bill.vendor?.name || 'N/A'}</p><p>{bill.vendor?.phone}</p><p><strong>Date:</strong> {formatDate(bill.timestamp)}</p></div>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th className="px-4 py-2">Item</th><th className="px-4 py-2 text-right">Weight/Units</th><th className="px-4 py-2 text-right">Rate</th><th className="px-4 py-2 text-right">Total</th></tr></thead>
            <tbody>
              {billItemsArray.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2 font-medium">{item.name || 'N/A'}</td>
                  <td className="px-4 py-2 text-right">{item.weight}</td>
                  <td className="px-4 py-2 text-right">₹{parseFloat(item.rate).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">₹{parseFloat(item.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="font-bold"><td colSpan="3" className="px-4 py-2 text-right text-lg">Grand Total</td><td className="px-4 py-2 text-right text-lg">₹{parseFloat(bill.totalBill).toFixed(2)}</td></tr></tfoot>
          </table>
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
          <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"><Printer className="w-4 h-4" /> Print</button>
        </div>
      </div>
    </div>
  );
};

const BillingContent = ({ users, vendors, bills, openBillModal }) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Completed Orders & Billing</h2>
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr><th scope="col" className="px-6 py-3">Date</th><th scope="col" className="px-6 py-3">Customer</th><th scope="col" className="px-6 py-3">Vendor</th><th scope="col" className="px-6 py-3 text-right">Amount</th><th scope="col" className="px-6 py-3 text-center">Action</th></tr>
          </thead>
          <tbody>
            {bills.map(bill => {
              const user = users.find(u => u.phone === bill.mobile);
              const vendor = vendors.find(v => v.id === bill.vendorId);
              return (
                <tr key={bill.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{formatDate(bill.timestamp)}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{user?.name || bill.mobile}</td>
                  <td className="px-6 py-4">{vendor?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-right font-semibold">₹{parseFloat(bill.totalBill).toFixed(2)}</td>
                  <td className="px-6 py-4 text-center"><button onClick={() => openBillModal({ ...bill, user, vendor })} className="font-medium text-blue-600 hover:underline">View Bill</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {bills.length === 0 && <p className="p-6 text-center text-gray-500">No completed orders found.</p>}
      </div>
    </div>
  );
};

const TransferOrderModal = ({ isOpen, onClose, onConfirm, assignment, vendors, processingId }) => {
  const [newVendorId, setNewVendorId] = useState('');
  if (!isOpen) return null;
  const availableVendors = vendors.filter(v => v.id !== assignment.vendorId);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Transfer Order</h3>
        <p className="text-sm text-gray-600 mb-2">Current Vendor: <span className="font-semibold">{assignment.vendorName}</span></p>
        <div className="space-y-2">
          <label htmlFor="vendor-select" className="text-sm font-medium text-gray-700">Select New Vendor:</label>
          <select id="vendor-select" value={newVendorId} onChange={(e) => setNewVendorId(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
            <option value="">-- Choose a vendor --</option>
            {availableVendors.map(v => (<option key={v.id} value={v.id}>{v.name} - {v.location}</option>))}
          </select>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
          <button type="button" onClick={() => onConfirm(assignment.id, newVendorId)} disabled={!newVendorId || processingId === assignment.id} className="flex items-center justify-center w-32 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
            {processingId === assignment.id ? <Loader className="w-5 h-5 animate-spin" /> : 'Confirm Transfer'}
          </button>
        </div>
      </div>
    </div>
  );
};

const OngoingOrdersContent = ({ assignments, users, vendors, wasteEntries, openTransferModal, openDeleteModal }) => {

  const enhancedAssignments = useMemo(() => {
    if (!assignments || !wasteEntries) return [];
    return assignments.map(a => {
      const relatedEntries = a.entryIds ? a.entryIds.map(id => wasteEntries.find(e => e.id === id)).filter(Boolean) : [];

      const totalQuantity = relatedEntries.reduce((sum, entry) => {
        const quantity = parseFloat(entry.quantity);
        return sum + (isNaN(quantity) ? 0 : quantity);
      }, 0);

      return {
        ...a,
        totalItems: a.entryIds?.length || 0,
        totalQuantity,
      };
    });
  }, [assignments, wasteEntries]);


  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Ongoing Orders</h2>
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Order ID</th>
              <th scope="col" className="px-6 py-3">Customer</th>
              <th scope="col" className="px-6 py-3">Vendor</th>
              <th scope="col" className="px-6 py-3 text-center">Items</th>
              <th scope="col" className="px-6 py-3 text-center">Quantity</th>
              <th scope="col" className="px-6 py-3 text-right">Est. Amount</th>
              <th scope="col" className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {enhancedAssignments.map(a => {
              const user = users.find(u => u.phone === a.mobile);
              const vendor = vendors.find(v => v.id === a.vendorId);
              return (
                <tr key={a.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{a.id.slice(-6)}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{user?.name || a.mobile}</td>
                  <td className="px-6 py-4">{vendor?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-center">{a.totalItems}</td>
                  <td className="px-6 py-4 text-center">{a.totalQuantity}</td>
                  <td className="px-6 py-4 text-right font-semibold">
                    ₹{typeof a.totalAmount === 'number' ? a.totalAmount.toFixed(2) : '0.00'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <button onClick={() => openTransferModal(a)} className="p-2 text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200" title="Transfer Order">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button onClick={() => openDeleteModal(a)} className="p-2 text-red-600 bg-red-100 rounded-md hover:bg-red-200" title="Delete Order">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {assignments.length === 0 && <p className="p-6 text-center text-gray-500">No ongoing orders found.</p>}
      </div>
    </div>
  )
};

// --- Admin Panel Component ---
const AdminPage = ({ handleSignOut }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeVendorTab, setActiveVendorTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Data State
  const [vendors, setVendors] = useState([]);
  const [users, setUsers] = useState([]);
  const [wasteEntries, setWasteEntries] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [items, setItems] = useState([]);
  const [bills, setBills] = useState([]);

  // Component State
  const [assignments, setAssignments] = useState({});
  const [newItem, setNewItem] = useState({ name: '', rate: '', unit: '', category: '', location: '', imageUrl: '' });
  const [currentItemId, setCurrentItemId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Modal States
  const [billToView, setBillToView] = useState(null);
  const [vendorToView, setVendorToView] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [transferModalState, setTransferModalState] = useState({ isOpen: false, assignment: null });

  useEffect(() => {
    const references = [
      { path: 'vendors', setter: setVendors }, { path: 'users', setter: setUsers },
      { path: 'wasteEntries', setter: setWasteEntries }, { path: 'assignments', setter: setAllAssignments },
      { path: 'items', setter: setItems }, { path: 'bills', setter: setBills },
    ];
    setLoading(true);

    const listeners = references.map(({ path, setter }) => {
      let dataRef = ref(db, path);
      if (path === 'users') {
        dataRef = query(dataRef, orderByChild('phone'));
      }
      return onValue(dataRef, (snapshot) => {
        setter(firebaseObjectToArray(snapshot));
      }, (error) => toast.error(`Could not sync ${path}.`));
    });

    Promise.all(listeners).finally(() => setLoading(false));
    return () => listeners.forEach(unsubscribe => unsubscribe && unsubscribe());
  }, []);

  const approvedVendors = useMemo(() => vendors.filter(v => v.status === 'approved'), [vendors]);
  const unassignedWasteEntries = useMemo(() => wasteEntries.filter(w => !w.isAssigned), [wasteEntries]);
  const ongoingAssignments = useMemo(() => allAssignments.filter(a => a.status === 'assigned'), [allAssignments]);
  const groupedUnassignedEntries = useMemo(() => {
    return unassignedWasteEntries.reduce((acc, entry) => {
      if (!acc[entry.mobile]) acc[entry.mobile] = [];
      acc[entry.mobile].push(entry);
      return acc;
    }, {});
  }, [unassignedWasteEntries]);

  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;
    setProcessingId(vendorToDelete.id);
    const vendorId = vendorToDelete.id;
    const updates = {};
    let affectedAssignmentsCount = 0;

    try {
      const assignmentsQuery = query(ref(db, 'assignments'), orderByChild('vendorId'), equalTo(vendorId));
      const assignmentsSnapshot = await get(assignmentsQuery);
      if (assignmentsSnapshot.exists()) {
        assignmentsSnapshot.forEach(assignSnap => {
          const assignment = { id: assignSnap.key, ...assignSnap.val() };
          affectedAssignmentsCount++;
          if (assignment.status === 'assigned' && assignment.entryIds) {
            assignment.entryIds.forEach(entryId => {
              updates[`/wasteEntries/${entryId}/isAssigned`] = false;
            });
          }
          updates[`/assignments/${assignment.id}`] = null;
        });
      }

      const billsQuery = query(ref(db, 'bills'), orderByChild('vendorId'), equalTo(vendorId));
      const billsSnapshot = await get(billsQuery);
      if (billsSnapshot.exists()) {
        billsSnapshot.forEach(billSnap => {
          updates[`/bills/${billSnap.key}`] = null;
        });
      }

      updates[`/vendors/${vendorId}`] = null;
      await update(ref(db), updates);
      toast.success(`Vendor '${vendorToDelete.name}' and all related data have been permanently deleted.`);
      setVendorToView(null);
    } catch (error) {
      toast.error('An error occurred during the deletion process.');
      console.error("Vendor deletion error:", error);
    } finally {
      setVendorToDelete(null);
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setProcessingId(userToDelete.id);
    const userId = userToDelete.id;
    const userMobile = userToDelete.phone;
    const updates = {};
    try {
      updates[`/users/${userId}`] = null;
      const wasteQuery = query(ref(db, 'wasteEntries'), orderByChild('mobile'), equalTo(userMobile));
      const wasteSnapshot = await get(wasteQuery);
      if (wasteSnapshot.exists()) {
        wasteSnapshot.forEach(snap => {
          updates[`/wasteEntries/${snap.key}`] = null;
        });
      }
      const assignmentsQuery = query(ref(db, 'assignments'), orderByChild('userId'), equalTo(userId));
      const assignmentsSnapshot = await get(assignmentsQuery);
      if (assignmentsSnapshot.exists()) {
        assignmentsSnapshot.forEach(snap => {
          updates[`/assignments/${snap.key}`] = null;
        });
      }
      const billsQuery = query(ref(db, 'bills'), orderByChild('userId'), equalTo(userId));
      const billsSnapshot = await get(billsQuery);
      if (billsSnapshot.exists()) {
        billsSnapshot.forEach(snap => {
          updates[`/bills/${snap.key}`] = null;
        });
      }
      await update(ref(db), updates);
      toast.success(`User '${userToDelete.name}' and all their related data have been permanently deleted.`);
    } catch (error) {
      toast.error('An error occurred during user deletion.');
      console.error("User deletion error:", error);
    } finally {
      setUserToDelete(null);
      setProcessingId(null);
    }
  };

  const updateVendorStatus = async (id, status) => {
    setProcessingId(id);
    try {
      await update(ref(db, `vendors/${id}`), { status });
      toast.success(`Vendor has been ${status}.`);
      setVendorToView(prev => ({ ...prev, status }));
    } catch (error) { toast.error('Vendor status update failed.'); }
    finally { setProcessingId(null); }
  };

  const toggleUserStatus = async (user) => {
    setProcessingId(user.id);
    const newStatus = user.Status?.toLowerCase() === 'blocked' ? 'Active' : 'Blocked';
    try {
      await update(ref(db, `users/${user.id}`), { Status: newStatus });
      toast.success(`User has been ${newStatus.toLowerCase()}.`);
    } catch (error) { toast.error('User status update failed.'); }
    finally { setProcessingId(null); }
  };

  const handleTransferOrder = async (assignmentId, newVendorId) => {
    setProcessingId(assignmentId);
    try {
      const newVendor = vendors.find(v => v.id === newVendorId);
      if (!newVendor) throw new Error("New vendor not found.");
      await update(ref(db, `assignments/${assignmentId}`), { vendorId: newVendor.id, vendorName: newVendor.name, vendorPhone: newVendor.phone, });
      toast.success("Order transferred successfully!");
      setTransferModalState({ isOpen: false, assignment: null });
    } catch (error) { toast.error('Failed to transfer order.'); }
    finally { setProcessingId(null); }
  };

  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    setProcessingId(assignmentToDelete.id);
    try {
      const updates = {};
      updates[`/assignments/${assignmentToDelete.id}`] = null;
      if (assignmentToDelete.entryIds && Array.isArray(assignmentToDelete.entryIds)) {
        assignmentToDelete.entryIds.forEach(entryId => {
          updates[`/wasteEntries/${entryId}/isAssigned`] = false;
        });
      }
      updates[`/users/${assignmentToDelete.userId}/Status`] = 'Active';
      updates[`/users/${assignmentToDelete.userId}/currentAssignmentId`] = null;
      updates[`/users/${assignmentToDelete.userId}/otp`] = null;
      await update(ref(db), updates);
      toast.success('Assignment deleted. Items are available for re-assignment.');
    } catch (error) { toast.error('Failed to delete assignment.'); }
    finally {
      setAssignmentToDelete(null);
      setProcessingId(null);
    }
  };

  const confirmGroupAssignment = async (mobile) => {
    const vendorId = assignments[mobile];
    if (!vendorId) return toast.info('Please select a vendor first.');
    setProcessingId(mobile);
    const vendor = vendors.find(v => v.id === vendorId);
    const entriesToAssign = wasteEntries.filter(w => w.mobile === mobile && !w.isAssigned);
    const user = users.find(u => u.phone === mobile);
    if (!vendor || !user || entriesToAssign.length === 0) {
      toast.error('Could not find all necessary data for assignment.');
      setProcessingId(null); return;
    }
    try {
      const updates = {};
      const productsSummary = entriesToAssign.map(e => `${e.name} (${e.quantity} ${e.unit})`).join(', ');
      const entryIds = entriesToAssign.map(e => e.id);
      const totalAmount = entriesToAssign.reduce((sum, entry) => sum + parseFloat(entry.total || 0), 0);
      const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const newAssignmentRef = push(ref(db, 'assignments'));
      updates[`/assignments/${newAssignmentRef.key}`] = { mobile, vendorId, vendorName: vendor.name, vendorPhone: vendor.phone, products: productsSummary, assignedAt: new Date().toISOString(), status: 'assigned', userId: user.id, entryIds, totalAmount };
      entriesToAssign.forEach(entry => { updates[`/wasteEntries/${entry.id}/isAssigned`] = true; });
      updates[`/users/${user.id}/Status`] = 'On-Schedule';
      updates[`/users/${user.id}/currentAssignmentId`] = newAssignmentRef.key;
      updates[`/users/${user.id}/otp`] = newOtp;
      await update(ref(db), updates);
      toast.success(`Order for ${user.name} assigned to ${vendor.name}.`);
      setAssignments(prev => ({ ...prev, [mobile]: '' }));
    } catch (error) { toast.error('Group assignment failed.'); }
    finally { setProcessingId(null); }
  };

  const handleItemInputChange = (e) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setCurrentItemId(null);
    setNewItem({ name: '', rate: '', unit: '', category: '', location: '', imageUrl: '' });
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    const { name, rate, unit, category, location } = newItem;
    if (!name || !rate || !unit || !category || !location) {
      return toast.error('Please fill out all required fields.');
    }

    let finalImageUrl = newItem.imageUrl.trim();
    if (finalImageUrl) {
      const shareLinkMatch = finalImageUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (shareLinkMatch && shareLinkMatch[1]) {
        finalImageUrl = `https://drive.google.com/uc?export=view&id=${shareLinkMatch[1]}`;
      } else if (!finalImageUrl.startsWith('http')) {
        finalImageUrl = `https://drive.google.com/uc?export=view&id=${finalImageUrl}`;
      }
    }

    setProcessingId(isEditing ? currentItemId : 'add-item');
    try {
      const itemData = { ...newItem, imageUrl: finalImageUrl, rate: parseFloat(newItem.rate) };
      if (isEditing) {
        await set(ref(db, `items/${currentItemId}`), itemData);
        toast.success('Item updated successfully.');
      } else {
        await set(push(ref(db, 'items')), itemData);
        toast.success('Item created successfully.');
      }
      cancelEdit();
    } catch (error) {
      toast.error('Failed to save item.');
      console.error("Save item error:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleEditItem = (item) => {
    setIsEditing(true);
    setCurrentItemId(item.id);
    let displayImageUrl = item.imageUrl || '';
    if (displayImageUrl.includes('drive.google.com/uc?export=view&id=')) {
      try {
        const url = new URL(displayImageUrl);
        const id = url.searchParams.get('id');
        if (id) {
          displayImageUrl = id;
        }
      } catch (e) {
        // Keep the original URL if it's malformed
      }
    }
    setNewItem({
      name: item.name,
      rate: item.rate,
      unit: item.unit,
      category: item.category,
      location: item.location,
      imageUrl: displayImageUrl
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await remove(ref(db, `items/${itemToDelete.id}`));
      toast.success('Item deleted successfully.');
    } catch (error) { toast.error('Item deletion failed.'); }
    finally { setItemToDelete(null); }
  };

  const renderContent = () => {
    if (loading) return <div className="flex justify-center items-center h-64"><Loader className="w-16 h-16 animate-spin text-blue-500" /></div>;
    const contentMap = {
      dashboard: <DashboardContent users={users} vendors={vendors} wasteEntries={wasteEntries} setActiveTab={setActiveTab} />,
      users: <UserManagementContent users={users} toggleUserStatus={toggleUserStatus} openDeleteModal={setUserToDelete} processingId={processingId} />,
      verification: <VendorVerificationContent vendors={vendors} openVendorDetailModal={setVendorToView} activeVendorTab={activeVendorTab} setActiveVendorTab={setActiveVendorTab} />,
      assignment: <AssignmentContent users={users} groupedUnassignedEntries={groupedUnassignedEntries} approvedVendors={approvedVendors} assignments={assignments} setAssignments={setAssignments} confirmGroupAssignment={confirmGroupAssignment} processingId={processingId} />,
      ongoing: <OngoingOrdersContent assignments={ongoingAssignments} users={users} vendors={vendors} wasteEntries={wasteEntries} openTransferModal={(assignment) => setTransferModalState({ isOpen: true, assignment })} openDeleteModal={setAssignmentToDelete} />,
      items: <ItemManagementContent items={items} newItem={newItem} setNewItem={setNewItem} handleInputChange={handleItemInputChange} handleItemSubmit={handleItemSubmit} isEditing={isEditing} processingId={processingId} setProcessingId={setProcessingId} handleEditItem={handleEditItem} openDeleteModal={setItemToDelete} cancelEdit={cancelEdit} />,
      billing: <BillingContent users={users} vendors={vendors} bills={bills} openBillModal={setBillToView} />,
    };
    return contentMap[activeTab] || null;
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <div className="md:flex">
        <aside className="w-full md:w-64 bg-white md:min-h-screen p-4 md:p-6 shadow-lg flex flex-col">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-8">Admin Panel</h1>
            <nav className="flex md:flex-col md:space-y-2 overflow-x-auto pb-2 -mx-4 px-4">
              <TabButton id="dashboard" label="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton id="users" label="Users" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton id="verification" label="Vendors" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton id="assignment" label="Assign Orders" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton id="ongoing" label="Ongoing Orders" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton id="items" label="Manage Items" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton id="billing" label="Billing" activeTab={activeTab} setActiveTab={setActiveTab} />
            </nav>
          </div>
          <div className="mt-auto pt-4"><button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-4 text-sm font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200"><SignOutIcon className="w-5 h-5" /> Sign Out</button></div>
        </aside>
        <main className="flex-1 p-4 sm:p-6 lg:p-8"><Suspense fallback={<div className="flex justify-center items-center h-64"><Loader className="w-16 h-16 animate-spin text-blue-500" /></div>}>{renderContent()}</Suspense></main>
      </div>

      {/* Modals */}
      <ConfirmationModal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={handleDeleteItem} title="Delete Item" message={`Are you sure you want to delete the item '${itemToDelete?.name}'? This action cannot be undone.`} />
      <ConfirmationModal isOpen={!!userToDelete} onClose={() => setUserToDelete(null)} onConfirm={handleDeleteUser} title="Delete User" message={`This will permanently delete the user '${userToDelete?.name}' and all their associated assignments, bills, and items. This action cannot be undone.`} />
      <ConfirmationModal isOpen={!!vendorToDelete} onClose={() => setVendorToDelete(null)} onConfirm={handleDeleteVendor} title="Delete Vendor" message={`This will permanently delete the vendor '${vendorToDelete?.name}' and all their assignments and bills. Ongoing orders will be returned to the queue. This cannot be undone.`} />
      <ConfirmationModal isOpen={!!assignmentToDelete} onClose={() => setAssignmentToDelete(null)} onConfirm={handleDeleteAssignment} title="Delete Assignment" message={`Are you sure you want to delete this assignment? The items will be returned to the assignment queue.`} />

      <ImageModal src={selectedImage} onClose={() => setSelectedImage(null)} />
      {billToView && <BillModal bill={billToView} onClose={() => setBillToView(null)} />}
      {vendorToView && <VendorDetailModal vendor={vendorToView} onClose={() => setVendorToView(null)} onUpdateStatus={updateVendorStatus} onDelete={setVendorToDelete} setSelectedImage={setSelectedImage} processingId={processingId} />}
      <TransferOrderModal isOpen={transferModalState.isOpen} onClose={() => setTransferModalState({ isOpen: false, assignment: null })} onConfirm={handleTransferOrder} assignment={transferModalState.assignment} vendors={approvedVendors} processingId={processingId} />
    </div>
  );
};


// --- Login Page Component ---
const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch (err) { toast.error('Login Failed. Please check your credentials.'); }
    finally { setLoading(false); }
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md mx-4">
        <h1 className="text-2xl font-bold text-center text-gray-800">Admin Panel Login</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div><label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label><input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /></div>
          <div><label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" /></div>
          <div><button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400">{loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Sign In'}</button></div>
        </form>
      </div>
    </div>
  );
};


// --- Main App Component (Gatekeeper) ---
const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => { setUser(user); setLoading(false); });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("You've been signed out.");
    } catch (error) {
      toast.error("Failed to sign out.");
    }
  };

  if (loading) {
    return (<div className="flex items-center justify-center min-h-screen bg-gray-100"><Loader className="w-16 h-16 animate-spin text-blue-500" /></div>);
  }

  return (
    <>
      {user ? <AdminPage handleSignOut={handleSignOut} /> : <AdminLogin />}
      <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light" />
    </>
  );
};

export default App;