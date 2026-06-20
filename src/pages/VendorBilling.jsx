import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';
import Avatar from '../components/Avatar';
import { vendorPhotoUrl } from '../utils/photos';

const ChevronRight = () => (
    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
);

const Loader = () => (
    <div className="flex justify-center items-center p-16">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const VendorBilling = () => {
    const [vendors, setVendors] = useState([]);
    const [assignmentCounts, setAssignmentCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const vendorsRef = ref(db, 'vendors');
        const unsub = onValue(vendorsRef, (snapshot) => {
            const data = snapshot.val();
            const vendorList = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            setVendors(vendorList.filter(v => v.status === 'approved'));
            setLoading(false);
        }, (error) => { console.error("Firebase error fetching vendors:", error); setLoading(false); });
        return () => unsub();
    }, []);

    // Count active (assigned) orders per vendor so admin sees who has work pending.
    useEffect(() => {
        const aRef = ref(db, 'assignments');
        const unsub = onValue(aRef, (snapshot) => {
            const data = snapshot.val() || {};
            const counts = {};
            Object.values(data).forEach(a => {
                if (a?.vendorId && (a.status === 'assigned')) counts[a.vendorId] = (counts[a.vendorId] || 0) + 1;
            });
            setAssignmentCounts(counts);
        });
        return () => unsub();
    }, []);

    if (loading) return <Loader />;

    const filtered = vendors.filter(v => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (v.name || '').toLowerCase().includes(q) || (v.phone || '').includes(q) || (v.location || '').toLowerCase().includes(q);
    });

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Vendor Billing</h2>
                <p className="text-gray-500 font-medium mt-1">Select a vendor to view their assigned orders and create a bill on their behalf.</p>
            </div>

            <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone, or location…"
                className="w-full mb-5 px-4 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-gray-800 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition"
            />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {filtered.length > 0 ? filtered.map(vendor => {
                    const vendorName = vendor.name || 'Unknown Vendor';
                    const photo = vendorPhotoUrl(vendor);
                    const count = assignmentCounts[vendor.id] || 0;
                    return (
                        <div
                            key={vendor.id}
                            className="p-4 sm:p-5 hover:bg-gray-50 cursor-pointer flex justify-between items-center transition-colors group"
                            onClick={() => navigate(`/vendor-orders/${vendor.id}`)}
                            role="button" tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && navigate(`/vendor-orders/${vendor.id}`)}
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                <Avatar src={photo} name={vendorName} size={52} />
                                <div className="min-w-0">
                                    <p className="font-black text-gray-900 truncate">{vendorName}</p>
                                    <p className="text-sm text-gray-500 font-medium truncate">{vendor.phone || 'No phone'} · 📍 {vendor.location || 'No location'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                                {count > 0 && (
                                    <span className="bg-brand-50 text-brand-700 border border-brand-200 text-xs font-black px-2.5 py-1 rounded-full">
                                        {count} order{count > 1 ? 's' : ''}
                                    </span>
                                )}
                                <ChevronRight />
                            </div>
                        </div>
                    );
                }) : (
                    <p className="p-12 text-center text-gray-400 font-bold">No approved vendors found.</p>
                )}
            </div>
        </div>
    );
};

export default VendorBilling;
