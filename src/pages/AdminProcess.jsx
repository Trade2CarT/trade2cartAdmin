import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ref, get, onValue, push, update } from 'firebase/database';
import { db } from '../firebase';

const Loader = () => (
    <div className="flex justify-center items-center h-full">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const TrashIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
);


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
                toast.error("Failed to load critical order data.");
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
        if (!vendor || !isSearchFocused) return [];
        const vendorLocation = vendor.location?.toLowerCase();
        const itemsInLocation = masterItems.filter(item => item.location?.toLowerCase() === vendorLocation);

        if (searchTerm) {
            return itemsInLocation.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return itemsInLocation; // Show all items for the location on focus if no search term
    }, [searchTerm, masterItems, vendor, isSearchFocused]);

    const handleAddItem = (item) => {
        const existingItem = billItems.find(billItem => billItem.id === item.id);
        if (existingItem) {
            handleUpdateQuantity(existingItem.billItemId, existingItem.weight + 1);
        } else {
            setBillItems(prev => [...prev, { ...item, billItemId: `${item.id}-${Date.now()}`, weight: 1, total: parseFloat(item.rate) }]);
        }
        setSearchTerm('');
        setIsSearchFocused(false);
    };

    const handleUpdateQuantity = (billItemId, newQuantity) => {
        newQuantity = parseFloat(newQuantity) || 0;
        if (newQuantity <= 0) {
            setBillItems(prevItems => prevItems.filter(item => item.billItemId !== billItemId));
        } else {
            setBillItems(prevItems => prevItems.map(item =>
                item.billItemId === billItemId ? { ...item, weight: newQuantity, total: newQuantity * parseFloat(item.rate) } : item
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
            return toast.error("Please add at least one item to the bill.");
        }
        setIsSubmitting(true);
        try {
            const billData = {
                assignmentID: assignmentId,
                vendorId: assignment.vendorId,
                userId: assignment.userId,
                billItems: billItems.map(({ id, billItemId, ...item }) => item), // Clean up data for DB
                totalBill,
                timestamp: new Date().toISOString(),
                mobile: assignment.mobile,
            };

            const updates = {};
            const newBillRef = push(ref(db, 'bills'));
            updates[`/bills/${newBillRef.key}`] = billData;
            updates[`/assignments/${assignmentId}/status`] = 'completed';
            updates[`/assignments/${assignmentId}/totalAmount`] = totalBill;
            updates[`/assignments/${assignmentId}/timestamp`] = new Date().toISOString();
            updates[`/users/${assignment.userId}/Status`] = 'available';
            updates[`/users/${assignment.userId}/otp`] = null;
            updates[`/users/${assignment.userId}/currentAssignmentId`] = null;

            await update(ref(db), updates);
            toast.success("Bill saved and order completed successfully!");
            navigate('/billing'); // Navigate to the main billing page to see the new entry
        } catch (error) {
            toast.error("An error occurred while submitting the bill.");
            console.error("Bill submission error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Bill</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Item Selection & Bill Summary */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Item Selection */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Items to Bill</h2>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} // Delay to allow click on results
                                placeholder="Search for items by name..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-shadow"
                            />
                            {isSearchFocused && (
                                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-2xl">
                                    {searchResults.length > 0 ? searchResults.map(item => (
                                        <div key={item.id} onClick={() => handleAddItem(item)} className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center">
                                            <span>{item.name}</span>
                                            <span className="text-sm text-gray-500">₹{item.rate}/{item.unit}</span>
                                        </div>
                                    )) : (
                                        <p className="px-4 py-3 text-gray-500">No items found for this location.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bill Summary */}
                    <div className="bg-white rounded-xl shadow-lg">
                        <h3 className="text-xl font-semibold text-gray-800 p-6 pb-0">Bill Summary</h3>
                        {billItems.length > 0 ? (
                            <div className="overflow-x-auto p-6">
                                <table className="w-full text-sm">
                                    <thead className="text-left text-gray-500">
                                        <tr>
                                            <th className="pb-4 font-medium">Item</th>
                                            <th className="pb-4 font-medium text-center">Quantity</th>
                                            <th className="pb-4 font-medium text-right">Subtotal</th>
                                            <th className="pb-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {billItems.map((item) => (
                                            <tr key={item.billItemId} className="border-t">
                                                <td className="py-4 font-medium text-gray-800">
                                                    {item.name}
                                                    <p className="text-xs text-gray-500 font-normal">@ ₹{parseFloat(item.rate).toFixed(2)}/{item.unit}</p>
                                                </td>
                                                <td className="py-4 w-40">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <input
                                                            type="number"
                                                            value={item.weight}
                                                            onChange={(e) => handleUpdateQuantity(item.billItemId, e.target.value)}
                                                            className="w-20 text-center border border-gray-300 rounded-md p-1"
                                                        />
                                                        <span className="text-gray-600">{item.unit}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-right font-semibold text-gray-800">₹{item.total.toFixed(2)}</td>
                                                <td className="py-4 text-center pl-4">
                                                    <button onClick={() => handleRemoveItem(item.billItemId)} className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50">
                                                        <TrashIcon />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="p-10 text-center text-gray-500">No items added to the bill yet.</p>
                        )}
                    </div>
                </div>

                {/* Right Column: Details & Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800">Details</h2>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Customer</p>
                            <p className="font-semibold text-gray-900">{customer?.name}</p>
                            <p className="text-gray-600">{customer?.phone}</p>
                            <p className="text-gray-600 mt-1">{customer?.address}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Assigned Vendor</p>
                            <p className="font-semibold text-gray-900">{vendor?.name}</p>
                        </div>
                    </div>
                    <div className="bg-green-600 text-white p-6 rounded-xl shadow-lg text-center space-y-2">
                        <p className="text-lg font-bold opacity-80">GRAND TOTAL</p>
                        <p className="text-5xl font-extrabold tracking-tight">₹{totalBill.toFixed(2)}</p>
                    </div>
                    <button onClick={handleSubmitBill} disabled={isSubmitting || billItems.length === 0} className="w-full py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all text-lg disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl">
                        {isSubmitting ? 'Submitting Bill...' : 'Confirm & Complete Order'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminProcess;