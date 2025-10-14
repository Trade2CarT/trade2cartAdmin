import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../firebase';

const VendorOrders = () => {
    const { vendorId } = useParams();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
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


        return () => {
            unsubscribeAssignments();
            unsubscribeUsers();
        };
    }, [vendorId]);

    if (loading) {
        return <div className="text-center p-10">Loading orders...</div>;
    }

    return (
        <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Assigned Orders</h2>
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3">Customer</th>
                            <th scope="col" className="px-6 py-3">Phone</th>
                            <th scope="col" className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignments.map(assignment => (
                            <tr key={assignment.id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{users[assignment.userId]?.name || 'N/A'}</td>
                                <td className="px-6 py-4">{assignment.mobile}</td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => navigate(`/vendor-otp/${vendorId}/${assignment.id}`)}
                                        className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-700">
                                        Create Bill
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VendorOrders;