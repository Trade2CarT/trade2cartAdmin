import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, query, orderByChild, equalTo, get } from 'firebase/database';
import { db } from '../firebase';
import Avatar from '../components/Avatar';
import { vendorPhotoUrl } from '../utils/photos';

const Loader = () => (
    <div className="flex justify-center items-center p-16">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const VendorOrders = () => {
    const { vendorId } = useParams();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [vendor, setVendor] = useState(null);
    const [users, setUsers] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const assignmentsQuery = query(ref(db, 'assignments'), orderByChild('vendorId'), equalTo(vendorId));
        const unsubscribeAssignments = onValue(assignmentsQuery, (snapshot) => {
            const data = snapshot.val();
            const assignmentList = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            setAssignments(assignmentList.filter(a => a.status === 'assigned'));
            setLoading(false);
        });

        const usersRef = ref(db, 'users');
        const unsubscribeUsers = onValue(usersRef, (snapshot) => {
            setUsers(snapshot.val() || {});
        });

        const vendorRef = ref(db, `vendors/${vendorId}`);
        get(vendorRef).then(snapshot => {
            if (snapshot.exists()) setVendor(snapshot.val());
        });

        return () => {
            unsubscribeAssignments();
            unsubscribeUsers();
        };
    }, [vendorId]);

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <button onClick={() => navigate('/vendor-billing')} className="text-sm font-bold text-brand-600 hover:underline mb-4 inline-flex items-center gap-1">
                    &larr; Back to Vendors
                </button>

                {/* Vendor header card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 mb-6">
                    <Avatar src={vendorPhotoUrl(vendor)} name={vendor?.name} size={56} />
                    <div className="min-w-0">
                        <h2 className="text-xl sm:text-2xl font-black text-gray-900 truncate">{vendor?.name || 'Loading…'}</h2>
                        <p className="text-sm text-gray-500 font-medium truncate">
                            {vendor?.phone || '—'}{vendor?.location ? ` · 📍 ${vendor.location}` : ''}
                        </p>
                    </div>
                    <span className="ml-auto bg-brand-50 text-brand-700 border border-brand-200 text-xs font-black px-3 py-1.5 rounded-full flex-shrink-0">
                        {assignments.length} pending
                    </span>
                </div>

                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Assigned Orders</p>

                {loading ? <Loader /> : assignments.length > 0 ? (
                    <div className="space-y-3">
                        {assignments.map(assignment => {
                            const user = users[assignment.userId];
                            return (
                                <div key={assignment.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <Avatar name={user?.name || '#'} size={44} />
                                        <div className="min-w-0">
                                            <p className="font-black text-gray-900 truncate">
                                                {user?.name || <span className="text-gray-400 italic font-medium">No name yet</span>}
                                            </p>
                                            <p className="text-xs font-bold text-gray-500">{assignment.mobile}</p>
                                            <p className="text-xs text-gray-400 font-medium truncate mt-0.5">
                                                📍 {user?.address || 'Address provided at pickup'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/admin-process/${assignment.id}`)}
                                        className="flex-shrink-0 px-5 py-2.5 bg-brand-600 text-white font-black rounded-xl text-sm hover:bg-brand-700 active:scale-95 transition-all shadow-sm">
                                        Create Bill
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400 font-bold">
                        No assigned orders for this vendor.
                    </div>
                )}
            </div>
        </div>
    );
};

export default VendorOrders;
