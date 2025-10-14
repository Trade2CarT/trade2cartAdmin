import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

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
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="text-center p-10">Loading vendors...</div>;
    }

    return (
        <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Select a Vendor for Billing</h2>
            <div className="bg-white rounded-lg shadow-md">
                <ul className="divide-y divide-gray-200">
                    {vendors.map(vendor => (
                        <li key={vendor.id}
                            className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                            onClick={() => navigate(`/vendor-orders/${vendor.id}`)}>
                            <div>
                                <p className="font-semibold text-lg">{vendor.name}</p>
                                <p className="text-sm text-gray-500">{vendor.phone}</p>
                            </div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default VendorBilling;