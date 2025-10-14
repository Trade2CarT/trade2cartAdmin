import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

// Simple SVG for the arrow icon
const ChevronRight = () => (
    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
);

const Loader = () => (
    <div className="flex justify-center items-center p-10">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const VendorBilling = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const vendorsRef = ref(db, 'vendors');
        const unsubscribe = onValue(vendorsRef, (snapshot) => {
            const data = snapshot.val();
            const vendorList = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            setVendors(vendorList.filter(vendor => vendor.status === 'approved'));
            setLoading(false);
        }, () => setLoading(false));

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Vendor Billing</h2>
            <p className="text-gray-600 mb-8">Select a vendor to view their assigned orders and create a bill on their behalf.</p>

            <div className="bg-white rounded-xl shadow-md">
                <div className="divide-y divide-gray-200">
                    {vendors.length > 0 ? vendors.map(vendor => (
                        <div
                            key={vendor.id}
                            className="p-4 sm:p-6 hover:bg-gray-50 cursor-pointer flex justify-between items-center transition-colors"
                            onClick={() => navigate(`/vendor-orders/${vendor.id}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && navigate(`/vendor-orders/${vendor.id}`)}
                        >
                            <div className="flex items-center gap-4">
                                {vendor.profilePhotoURL ? (
                                    <img src={vendor.profilePhotoURL} alt={vendor.name} className="w-12 h-12 rounded-full object-cover" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xl">
                                        {vendor.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-lg text-gray-900">{vendor.name}</p>
                                    <p className="text-sm text-gray-500">{vendor.phone} &middot; {vendor.location}</p>
                                </div>
                            </div>
                            <ChevronRight />
                        </div>
                    )) : (
                        <p className="p-8 text-center text-gray-500">No approved vendors found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorBilling;