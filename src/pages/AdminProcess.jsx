import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ref, get, onValue, push, update } from 'firebase/database';
import { db } from '../firebase';

const AdminProcess = () => {
    const navigate = useNavigate();
    const { assignmentId } = useParams();

    const [assignment, setAssignment] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [vendor, setVendor] = useState(null);
    const [masterItems, setMasterItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [billItems, setBillItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const assignmentRef = ref(db, `assignments/${assignmentId}`);
                const assignmentSnapshot = await get(assignmentRef);
                if (!assignmentSnapshot.exists()) {
                    toast.error("Order not found.");
                    navigate('/vendor-billing');
                    return;
                }
                const assignmentData = { id: assignmentSnapshot.key, ...assignmentSnapshot.val() };
                setAssignment(assignmentData);

                const userRef = ref(db, `users/${assignmentData.userId}`);
                const userSnapshot = await get(userRef);
                setCustomer(userSnapshot.val());

                const vendorRef = ref(db, `vendors/${assignmentData.vendorId}`);
                const vendorSnapshot = await get(vendorRef);
                setVendor(vendorSnapshot.val());

            } catch (error) {
                toast.error("Failed to load order data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        const itemsRef = ref(db, 'items');
        const unsubscribe = onValue(itemsRef, (snapshot) => {
            const data = snapshot.val();
            const itemsArray = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
            setMasterItems(itemsArray);
        });
        return () => unsubscribe();
    }, [assignmentId, navigate]);

    const searchResults = useMemo(() => {
        if (!vendor) return [];
        const vendorLocation = vendor.location?.toLowerCase();
        const itemsInLocation = masterItems.filter(item => item.location?.toLowerCase() === vendorLocation);
        if (searchTerm) {
            return itemsInLocation.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return itemsInLocation;
    }, [searchTerm, masterItems, vendor]);

    const handleAddItem = (item) => {
        const existingItem = billItems.find(billItem => billItem.id === item.id);
        if (existingItem) {
            const newBillItems = billItems.map(i => i.id === item.id ? { ...i, weight: i.weight + 1, total: (i.weight + 1) * i.rate } : i);
            setBillItems(newBillItems);
        } else {
            setBillItems([...billItems, { ...item, billItemId: `${item.id}-${Date.now()}`, weight: 1, total: item.rate }]);
        }
        setSearchTerm('');
        setIsSearchFocused(false);
    };

    const handleUpdateQuantity = (billItemId, newQuantity) => {
        if (newQuantity < 1) {
            setBillItems(prevItems => prevItems.filter(item => item.billItemId !== billItemId));
        } else {
            setBillItems(prevItems => prevItems.map(item =>
                item.billItemId === billItemId ? { ...item, weight: newQuantity, total: newQuantity * item.rate } : item
            ));
        }
    };

    const handleRemoveItem = (billItemId) => {
        setBillItems(prev => prev.filter(item => item.billItemId !== billItemId));
    };

    const totalBill = useMemo(() => {
        return billItems.reduce((acc, item) => acc + (item.total || 0), 0);
    }, [billItems]);

    const handleSubmitBill = async () => {
        if (billItems.length === 0) {
            return toast.error("Please add at least one item.");
        }
        setIsSubmitting(true);
        try {
            const billData = {
                assignmentID: assignmentId,
                vendorId: assignment.vendorId,
                userId: assignment.userId,
                billItems: billItems.map(({ id, billItemId, ...item }) => item),
                totalBill,
                timestamp: new Date().toISOString(),
                mobile: assignment.mobile,
            };

            const updates = {};
            const newBillRef = push(ref(db, 'bills'));
            updates[`/bills/${newBillRef.key}`] = billData;
            updates[`/assignments/${assignmentId}/status`] = 'completed';
            updates[`/assignments/${assignmentId}/totalAmount`] = totalBill;
            updates[`/users/${assignment.userId}/Status`] = 'available';
            updates[`/users/${assignment.userId}/otp`] = null;
            updates[`/users/${assignment.userId}/currentAssignmentId`] = null;

            await update(ref(db), updates);
            toast.success("Bill saved and order completed!");
            navigate('/billing');
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="text-center p-10">Loading...</div>;
    }

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Create Bill</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-4 rounded-xl shadow-md">
                        <h2 className="text-lg font-semibold text-gray-700 mb-3">Add Item</h2>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                placeholder="Search for items..."
                                className="w-full p-2 border rounded-md"
                            />
                            {isSearchFocused && searchResults.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
                                    {searchResults.map(item => (
                                        <li key={item.id} onMouseDown={() => handleAddItem(item)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                                            {item.name} (₹{item.rate}/{item.unit})
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    {billItems.length > 0 && (
                        <div className="bg-white p-4 rounded-xl shadow-md">
                            <h3 className="text-lg font-semibold text-gray-700 mb-3">Bill Summary</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr>
                                            <th className="p-2">Item</th>
                                            <th className="p-2 text-center">Quantity</th>
                                            <th className="p-2 text-right">Rate</th>
                                            <th className="p-2 text-right">Total</th>
                                            <th className="p-2 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {billItems.map((item) => (
                                            <tr key={item.billItemId} className="border-t">
                                                <td className="p-2 font-medium">{item.name}</td>
                                                <td className="p-2">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => handleUpdateQuantity(item.billItemId, item.weight - 1)}>-</button>
                                                        <span>{item.weight} {item.unit}</span>
                                                        <button onClick={() => handleUpdateQuantity(item.billItemId, item.weight + 1)}>+</button>
                                                    </div>
                                                </td>
                                                <td className="p-2 text-right">₹{item.rate.toFixed(2)}</td>
                                                <td className="p-2 text-right">₹{item.total.toFixed(2)}</td>
                                                <td className="p-2 text-center">
                                                    <button onClick={() => handleRemoveItem(item.billItemId)}>X</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
                <div className="space-y-6">
                    <div className="bg-white p-4 rounded-xl shadow-md">
                        <h2 className="text-lg font-semibold text-gray-700 mb-3">Customer Details</h2>
                        <p>{customer?.name}</p>
                        <p>{customer?.phone}</p>
                        <p>{customer?.address}</p>
                    </div>
                    <div className="bg-green-100 p-4 rounded-xl shadow-md text-center">
                        <p className="text-xl font-bold text-green-800">Total Bill</p>
                        <p className="text-3xl font-bold text-green-800">₹{totalBill.toFixed(2)}</p>
                    </div>
                    <button onClick={handleSubmitBill} disabled={isSubmitting} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700">
                        {isSubmitting ? 'Saving...' : 'Confirm & Complete Order'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminProcess;