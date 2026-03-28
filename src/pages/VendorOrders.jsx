import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, query, orderByChild, equalTo, get } from 'firebase/database';
import { db } from '../firebase';

const Loader = () => (
    <div className="flex justify-center items-center p-10">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
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

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="max-w-5xl mx-auto">
            <button onClick={() => navigate('/vendor-billing')} className="text-sm text-blue-600 hover:underline mb-4">&larr; Back to Vendors</button>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Assigned Orders</h2>
            <p className="text-gray-600 mb-8">Showing pending orders for <span className="font-semibold">{vendor?.name || '...'}</span>.</p>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-4">Customer</th>
                                <th scope="col" className="px-6 py-4">Phone</th>
                                <th scope="col" className="px-6 py-4">Address</th>
                                <th scope="col" className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.length > 0 ? assignments.map(assignment => (
                                <tr key={assignment.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{users[assignment.userId]?.name || 'N/A'}</td>
                                    <td className="px-6 py-4">{assignment.mobile}</td>
                                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{users[assignment.userId]?.address || 'Not available'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            // ✅ THE FIX: Instantly bypasses the OTP page and jumps straight to the Admin Process page!
                                            // Make sure the route below matches what you named it in App.jsx (e.g. '/admin-process/:assignmentId')
                                            onClick={() => navigate(`/admin-process/${assignment.id}`)}
                                            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-700 transition-colors">
                                            Create Bill
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-12 text-gray-500">No assigned orders for this vendor.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VendorOrders;