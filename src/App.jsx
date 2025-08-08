import React, { useEffect, useState, useMemo, Suspense } from 'react';

// --- FIREBASE IMPORTS ---
import { db, auth } from './firebase';
import { ref, set, update, remove, push, onValue } from 'firebase/database';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

// --- TOASTIFY IMPORTS ---
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- SVG ICONS AS REACT COMPONENTS ---
// For better organization, these icons should be in their own files (e.g., 'src/components/Icons.jsx')
const Users = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const Truck = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11" /><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2" /><circle cx="7.5" cy="18.5" r="2.5" /><circle cx="17.5" cy="18.5" r="2.5" /></svg>;
const Package = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" /><path d="M12 15H3l-1-5L2 2h20l-1 8h-9" /><path d="m9.5 9.4 1.35 1.35a.5.5 0 0 0 .7 0L13 9.4" /></svg>;
const Clock = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const ChevronDown = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>;
const CheckCircle = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const XCircle = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>;
const AlertTriangle = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>;
const X = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const Loader = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>;
const Printer = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>;
const SignOutIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>;

// --- Helper Functions ---
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const firebaseObjectToArray = (snapshot) => {
  const data = snapshot.val();
  return data ? Object.keys(data).map(key => ({ id: key, ...data[key] })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) : [];
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
// It's highly recommended to move each component to its own file in a 'src/components' directory.
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
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
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4" onClick={onClose}>
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
// Each of these '...Content' components should be in its own file.

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

const UserManagementContent = ({ users }) => (
  <div>
    <h2 className="text-2xl font-semibold text-gray-800 mb-6">User Management</h2>
    <div className="bg-white rounded-lg shadow-md overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr><th scope="col" className="px-6 py-3">Name</th><th scope="col" className="px-6 py-3">Phone</th><th scope="col" className="px-6 py-3">Status</th></tr>
        </thead>
        <tbody>
          {users.map(user => (<tr key={user.id} className="bg-white border-b hover:bg-gray-50"><td className="px-6 py-4 font-medium text-gray-900">{user.name || 'N/A'}</td><td className="px-6 py-4">{user.phone}</td><td className="px-6 py-4">{user.Status}</td></tr>))}
        </tbody>
      </table>
    </div>
  </div>
);

const VendorVerificationContent = ({ vendors, showDetails, toggleDetails, setSelectedImage, verifyVendor, processingId, activeVendorTab, setActiveVendorTab }) => {
  const [pendingVendors, approvedVendors, rejectedVendors] = useMemo(() => [
    vendors.filter(v => v.status === 'pending'),
    vendors.filter(v => v.status === 'approved'),
    vendors.filter(v => v.status === 'rejected')
  ], [vendors]);

  const VendorCard = ({ v, actions = true }) => (
    <div key={v.id} className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xl font-bold text-gray-800">{v.name}</p>
            <p className="text-sm text-gray-500">{v.phone}</p>
            <p className="text-xs text-gray-400 mt-1">Submitted: {formatDate(v.createdAt)}</p>
          </div>
          <div className="mt-4 sm:mt-0 flex-shrink-0 flex items-center space-x-2">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${v.status === 'approved' ? 'bg-green-100 text-green-800' : v.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{v.status || 'pending'}</span>
            <button onClick={() => toggleDetails(v.id)} className="p-2 rounded-full hover:bg-gray-100"><ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${showDetails[v.id] ? 'rotate-180' : ''}`} /></button>
          </div>
        </div>
      </div>
      {showDetails[v.id] && (
        <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div><p className="font-semibold text-gray-700">Location:</p><p className="text-gray-600">{v.location}</p></div>
            <div><p className="font-semibold text-gray-700">Aadhaar:</p><p className="text-gray-600">{v.aadhaar}</p></div>
            <div><p className="font-semibold text-gray-700">PAN:</p><p className="text-gray-600">{v.pan}</p></div>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <img src={v.aadhaarPhoto} alt="Aadhaar" className="w-full h-auto rounded-lg shadow cursor-pointer" onClick={() => setSelectedImage(v.aadhaarPhoto)} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x250/e2e8f0/334155?text=Aadhaar+Not+Found'; }} />
            <img src={v.panPhoto} alt="PAN" className="w-full h-auto rounded-lg shadow cursor-pointer" onClick={() => setSelectedImage(v.panPhoto)} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x250/e2e8f0/334155?text=PAN+Not+Found'; }} />
            <img src={v.licensePhoto} alt="License" className="w-full h-auto rounded-lg shadow cursor-pointer" onClick={() => setSelectedImage(v.licensePhoto)} onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x250/e2e8f0/334155?text=License+Not+Found'; }} />
          </div>
          {actions && (
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => verifyVendor(v.id, 'rejected')} disabled={processingId === v.id} className="flex items-center justify-center w-24 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-gray-400">{processingId === v.id ? <Loader className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-2" /> Reject</>}</button>
              <button onClick={() => verifyVendor(v.id, 'approved')} disabled={processingId === v.id} className="flex items-center justify-center w-28 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400">{processingId === v.id ? <Loader className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" /> Approve</>}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const VendorList = ({ vendors, type }) => (
    <div className="space-y-6">
      {vendors.length > 0 ? (vendors.map(v => <VendorCard v={v} key={v.id} actions={type === 'pending'} />)) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm"><p className="text-gray-500">No vendors in this category.</p></div>
      )}
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Vendor Verification</h2>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-2 sm:space-x-6" aria-label="Tabs">
          <button onClick={() => setActiveVendorTab('pending')} className={`${activeVendorTab === 'pending' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Pending <span className="bg-yellow-100 text-yellow-800 ml-2 px-2 py-0.5 rounded-full text-xs">{pendingVendors.length}</span></button>
          <button onClick={() => setActiveVendorTab('approved')} className={`${activeVendorTab === 'approved' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Approved <span className="bg-green-100 text-green-800 ml-2 px-2 py-0.5 rounded-full text-xs">{approvedVendors.length}</span></button>
          <button onClick={() => setActiveVendorTab('rejected')} className={`${activeVendorTab === 'rejected' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Rejected <span className="bg-red-100 text-red-800 ml-2 px-2 py-0.5 rounded-full text-xs">{rejectedVendors.length}</span></button>
        </nav>
      </div>
      <div className="mt-6">
        {activeVendorTab === 'pending' && <VendorList vendors={pendingVendors} type="pending" />}
        {activeVendorTab === 'approved' && <VendorList vendors={approvedVendors} type="approved" />}
        {activeVendorTab === 'rejected' && <VendorList vendors={rejectedVendors} type="rejected" />}
      </div>
    </div>
  );
};

const AssignmentContent = ({ users, groupedUnassignedEntries, approvedVendors, assignments, handleAssignChange, confirmGroupAssignment, processingId }) => {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Assign New Orders</h2>
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Customer</th>
              <th scope="col" className="px-6 py-3">Location</th>
              <th scope="col" className="px-6 py-3">Items</th>
              <th scope="col" className="px-6 py-3">Assign Vendor</th>
              <th scope="col" className="px-6 py-3">Action</th>
            </tr>
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
                    <select value={assignments[mobile] || ''} onChange={(e) => handleAssignChange(mobile, e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
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
    } catch (error) {
      toast.error('Failed to copy items.');
    } finally {
      setProcessingId(null);
    }
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
        <form onSubmit={handleItemSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
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
          <div className="flex items-center space-x-2 md:col-span-2 lg:col-span-3 xl:col-span-1">
            <button type="submit" disabled={!!processingId} className="flex-grow flex justify-center items-center px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400">{!!processingId ? <Loader className="w-5 h-5 animate-spin" /> : (isEditing ? 'Update' : 'Add Item')}</button>
            {isEditing && (<button type="button" onClick={cancelEdit} className="flex-shrink-0 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>)}
          </div>
        </form>
      </div>
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th scope="col" className="px-6 py-3">Name</th><th scope="col" className="px-6 py-3">Rate</th><th scope="col" className="px-6 py-3">Unit</th><th scope="col" className="px-6 py-3">Category</th><th scope="col" className="px-6 py-3">Location</th><th scope="col" className="px-6 py-3">Actions</th></tr></thead>
          <tbody>{items.map(item => (<tr key={item.id} className="bg-white border-b hover:bg-gray-50"><td className="px-6 py-4 font-medium text-gray-900">{item.name}</td><td className="px-6 py-4">₹{item.rate}</td><td className="px-6 py-4">{item.unit}</td><td className="px-6 py-4">{item.category}</td><td className="px-6 py-4">{item.location}</td><td className="px-6 py-4 flex space-x-2"><button onClick={() => handleEditItem(item)} className="font-medium text-indigo-600 hover:underline">Edit</button><button onClick={() => openDeleteModal(item.id)} className="font-medium text-red-600 hover:underline">Delete</button></td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}

const BillModal = ({ bill, onClose }) => {
  if (!bill) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('bill-to-print').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Print Bill</title>');
    printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>'); // For styling in print window
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
            </div>
            <div className="text-right">
              <p className="font-semibold">Collected By:</p>
              <p>{bill.vendor?.name || 'N/A'}</p>
              <p>{bill.vendor?.phone}</p>
              <p><strong>Date:</strong> {formatDate(bill.timestamp)}</p>
            </div>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2 text-right">Weight/Units</th>
                <th className="px-4 py-2 text-right">Rate</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {bill.billItems.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="px-4 py-2 font-medium">{item.item}</td>
                  <td className="px-4 py-2 text-right">{item.weight}</td>
                  <td className="px-4 py-2 text-right">₹{parseFloat(item.rate).toFixed(2)}</td>
                  <td className="px-4 py-2 text-right">₹{parseFloat(item.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td colSpan="3" className="px-4 py-2 text-right text-lg">Grand Total</td>
                <td className="px-4 py-2 text-right text-lg">₹{parseFloat(bill.totalBill).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
          <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
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
            <tr>
              <th scope="col" className="px-6 py-3">Date</th>
              <th scope="col" className="px-6 py-3">Customer</th>
              <th scope="col" className="px-6 py-3">Vendor</th>
              <th scope="col" className="px-6 py-3 text-right">Amount</th>
              <th scope="col" className="px-6 py-3 text-center">Action</th>
            </tr>
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
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => openBillModal({ ...bill, user, vendor })} className="font-medium text-blue-600 hover:underline">
                      View Bill
                    </button>
                  </td>
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


// --- Admin Panel Component ---
const AdminPage = ({ handleSignOut }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeVendorTab, setActiveVendorTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [users, setUsers] = useState([]);
  const [wasteEntries, setWasteEntries] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [items, setItems] = useState([]);
  const [bills, setBills] = useState([]);

  const [assignments, setAssignments] = useState({});
  const [showDetails, setShowDetails] = useState({});
  const [newItem, setNewItem] = useState({ name: '', rate: '', unit: '', category: '', location: '' });
  const [currentItemId, setCurrentItemId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [billToView, setBillToView] = useState(null);

  useEffect(() => {
    setLoading(true);
    const references = [
      { path: 'vendors', setter: setVendors },
      { path: 'users', setter: setUsers },
      { path: 'wasteEntries', setter: setWasteEntries },
      { path: 'assignments', setter: setAllAssignments },
      { path: 'items', setter: setItems },
      { path: 'bills', setter: setBills },
    ];

    const listeners = references.map(({ path, setter }) =>
      onValue(ref(db, path),
        (snapshot) => setter(firebaseObjectToArray(snapshot)),
        (error) => toast.error(`Could not sync ${path}.`)
      )
    );
    setLoading(false);

    return () => listeners.forEach(unsubscribe => unsubscribe());
  }, []);

  const approvedVendors = useMemo(() => vendors.filter(v => v.status === 'approved'), [vendors]);
  const unassignedWasteEntries = useMemo(() => wasteEntries.filter(w => !w.isAssigned), [wasteEntries]);
  const groupedUnassignedEntries = useMemo(() => {
    return unassignedWasteEntries.reduce((acc, entry) => {
      if (!acc[entry.mobile]) acc[entry.mobile] = [];
      acc[entry.mobile].push(entry);
      return acc;
    }, {});
  }, [unassignedWasteEntries]);

  const verifyVendor = async (id, status) => {
    setProcessingId(id);
    try {
      await update(ref(db, `vendors/${id}`), { status });
      toast.success(`Vendor has been ${status}.`);
      setActiveVendorTab(status);
    } catch (error) {
      toast.error('Vendor verification failed.');
    } finally {
      setProcessingId(null);
    }
  };

  const toggleDetails = (id) => setShowDetails(prev => ({ ...prev, [id]: !prev[id] }));
  const handleAssignChange = (mobile, vendorId) => setAssignments(prev => ({ ...prev, [mobile]: vendorId }));

  const confirmGroupAssignment = async (mobile) => {
    const vendorId = assignments[mobile];
    if (!vendorId) return toast.info('Please select a vendor first.');

    setProcessingId(mobile);
    const vendor = vendors.find(v => v.id === vendorId);
    const entriesToAssign = wasteEntries.filter(w => w.mobile === mobile && !w.isAssigned);
    const user = users.find(u => u.phone === mobile);

    if (!vendor || !user || entriesToAssign.length === 0) {
      toast.error('Could not find all necessary data for assignment.');
      setProcessingId(null);
      return;
    }

    try {
      const updates = {};
      const productsSummary = entriesToAssign.map(e => `${e.name} (${e.quantity} ${e.unit})`).join(', ');
      const totalAmount = entriesToAssign.reduce((sum, e) => sum + parseFloat(e.total || 0), 0);

      const newAssignmentRef = push(ref(db, 'assignments'));
      updates[`/assignments/${newAssignmentRef.key}`] = {
        mobile,
        vendorId,
        vendorName: vendor.name,
        vendorPhone: vendor.phone,
        products: productsSummary,
        totalAmount,
        assignedAt: new Date().toISOString(),
        status: 'assigned'
      };

      entriesToAssign.forEach(entry => {
        updates[`/wasteEntries/${entry.id}/isAssigned`] = true;
      });
      updates[`/users/${user.id}/Status`] = 'On-Schedule';

      await update(ref(db), updates);
      toast.success(`Order for ${user.name} assigned to ${vendor.name}.`);
    } catch (error) {
      toast.error('Group assignment failed.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleItemInputChange = (e) => setNewItem(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const cancelEdit = () => { setIsEditing(false); setCurrentItemId(null); setNewItem({ name: '', rate: '', unit: '', category: '', location: '' }); };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    if (Object.values(newItem).some(val => !val)) return toast.error('Please fill out all fields.');

    setProcessingId(isEditing ? currentItemId : 'add-item');
    try {
      if (isEditing) {
        await set(ref(db, `items/${currentItemId}`), newItem);
        toast.success('Item updated successfully.');
      } else {
        await set(push(ref(db, 'items')), newItem);
        toast.success('Item created successfully.');
      }
      cancelEdit();
    } catch (error) {
      toast.error('Failed to save item.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleEditItem = (item) => {
    setIsEditing(true);
    setCurrentItemId(item.id);
    setNewItem({ name: item.name, rate: item.rate, unit: item.unit, category: item.category, location: item.location });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openDeleteModal = (id) => { setItemToDelete(id); setIsModalOpen(true); };
  const closeDeleteModal = () => { setItemToDelete(null); setIsModalOpen(false); };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      await remove(ref(db, `items/${itemToDelete}`));
      toast.success('Item deleted successfully.');
    } catch (error) {
      toast.error('Item deletion failed.');
    } finally {
      closeDeleteModal();
    }
  };

  const openBillModal = (bill) => setBillToView(bill);

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center items-center h-64"><Loader className="w-16 h-16 animate-spin text-blue-500" /></div>;
    }

    const contentMap = {
      dashboard: <DashboardContent users={users} vendors={vendors} wasteEntries={wasteEntries} setActiveTab={setActiveTab} />,
      users: <UserManagementContent users={users} />,
      verification: <VendorVerificationContent vendors={vendors} showDetails={showDetails} toggleDetails={toggleDetails} setSelectedImage={setSelectedImage} verifyVendor={verifyVendor} processingId={processingId} activeVendorTab={activeVendorTab} setActiveVendorTab={setActiveVendorTab} />,
      assignment: <AssignmentContent users={users} groupedUnassignedEntries={groupedUnassignedEntries} approvedVendors={approvedVendors} assignments={assignments} handleAssignChange={handleAssignChange} confirmGroupAssignment={confirmGroupAssignment} processingId={processingId} />,
      items: <ItemManagementContent items={items} newItem={newItem} setNewItem={setNewItem} handleInputChange={handleItemInputChange} handleItemSubmit={handleItemSubmit} isEditing={isEditing} processingId={processingId} setProcessingId={setProcessingId} handleEditItem={handleEditItem} openDeleteModal={openDeleteModal} cancelEdit={cancelEdit} />,
      billing: <BillingContent users={users} vendors={vendors} bills={bills} openBillModal={openBillModal} />,
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
              <TabButton id="items" label="Manage Items" activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabButton id="billing" label="Billing" activeTab={activeTab} setActiveTab={setActiveTab} />
            </nav>
          </div>
          <div className="mt-auto pt-4">
            <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-4 text-sm font-medium text-red-600 bg-red-100 rounded-lg hover:bg-red-200">
              <SignOutIcon className="w-5 h-5" /> Sign Out
            </button>
          </div>
        </aside>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader className="w-16 h-16 animate-spin text-blue-500" /></div>}>
            {renderContent()}
          </Suspense>
        </main>
      </div>
      <ConfirmationModal isOpen={isModalOpen} onClose={closeDeleteModal} onConfirm={handleDeleteItem} title="Delete Item" message="Are you sure you want to delete this item? This action cannot be undone." />
      <ImageModal src={selectedImage} onClose={() => setSelectedImage(null)} />
      {billToView && <BillModal bill={billToView} onClose={() => setBillToView(null)} />}
    </div>
  );
};


// --- Login Page Component ---
const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      toast.error('Login Failed. Please check your credentials.');
      console.error("Login Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md mx-4">
        <h1 className="text-2xl font-bold text-center text-gray-800">Admin Panel Login</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400">
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </button>
          </div>
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("You've been signed out.");
    } catch (error) {
      console.error("Sign Out Error", error);
      toast.error("Failed to sign out.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader className="w-16 h-16 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <>
      {user ? <AdminPage handleSignOut={handleSignOut} /> : <AdminLogin />}
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </>
  );
};

export default App;


  