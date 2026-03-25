import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ref, get, onValue, push, update } from 'firebase/database';
import { db } from '../firebase';

// --- ICONS ---
const Loader = () => (
    <div className="flex justify-center items-center h-full">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
);
const TrashIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>;
const PlusIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>;

const AdminProcess = () => {
    const navigate = useNavigate();
    const { assignmentId } = useParams();

    const [assignment, setAssignment] = useState(null);
    const [customer, setCustomer] = useState(null);
    const [vendor, setVendor] = useState(null);
    const [masterItems, setMasterItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Aligned state with Vendor app
    const [billItems, setBillItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    // Custom Item Modal State
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customName, setCustomName] = useState('');
    const [customRate, setCustomRate] = useState('');

    const searchContainerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setIsSearchFocused(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
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
                if (userSnapshot.exists()) setCustomer(userSnapshot.val());

                const vendorRef = ref(db, `vendors/${assignmentData.vendorId}`);
                const vendorSnapshot = await get(vendorRef);
                if (vendorSnapshot.exists()) setVendor(vendorSnapshot.val());

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

        if (searchTerm.trim()) {
            return itemsInLocation.filter(item =>
                item.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
            );
        }
        return itemsInLocation;
    }, [searchTerm, masterItems, vendor, isSearchFocused]);

    // Aligned handleAddItem with Vendor app (rateInput, weightInput)
    const handleAddItem = (item) => {
        const existingItem = billItems.find(billItem => billItem.id === item.id);
        if (existingItem) {
            toast.info(`${item.name} is already added. You can change weight below.`);
        } else {
            const rateVal = parseFloat(item.rate) || 0;
            const newBillItem = {
                ...item,
                billItemId: `${item.id}-${Date.now()}`,
                rateInput: item.rate.toString(),
                rate: rateVal,
                weightInput: "1",
                weight: 1,
                total: rateVal * 1,
            };
            setBillItems(prev => [...prev, newBillItem]);
        }
        setSearchTerm('');
        setIsSearchFocused(false);
    };

    // Aligned Custom Item Logic
    const handleAddCustom = () => {
        if (!customName.trim() || !customRate.trim()) return toast.error("Please enter a name and price.");
        const rateVal = parseFloat(customRate) || 0;
        const newItem = {
            id: `custom-${Date.now()}`,
            billItemId: `custom-${Date.now()}`,
            name: customName,
            rateInput: customRate,
            rate: rateVal,
            weightInput: "1",
            weight: 1,
            unit: 'kg',
            total: rateVal * 1,
        };
        setBillItems(prev => [...prev, newItem]);
        setShowCustomModal(false);
        setCustomName('');
        setCustomRate('');
    };

    // Aligned editable Rate logic
    const handleUpdateRate = (billItemId, newRateInput) => {
        setBillItems(prev => prev.map(item => {
            if (item.billItemId === billItemId) {
                const parsedRate = parseFloat(newRateInput) || 0;
                return { ...item, rateInput: newRateInput, rate: parsedRate, total: parsedRate * item.weight };
            }
            return item;
        }));
    };

    // Aligned editable Weight logic
    const handleUpdateWeight = (billItemId, newWeightInput) => {
        setBillItems(prev => prev.map(item => {
            if (item.billItemId === billItemId) {
                const parsedWeight = parseFloat(newWeightInput) || 0;
                return { ...item, weightInput: newWeightInput, weight: parsedWeight, total: item.rate * parsedWeight };
            }
            return item;
        }));
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
            // Data structure explicitly matches the Vendor App
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
            updates[`/assignments/${assignmentId}/timestamp`] = new Date().toISOString();
            updates[`/users/${assignment.userId}/Status`] = 'available';
            updates[`/users/${assignment.userId}/otp`] = null;
            updates[`/users/${assignment.userId}/currentAssignmentId`] = null;

            await update(ref(db), updates);
            toast.success("Bill saved and order completed successfully!");
            navigate('/vendor-billing');
        } catch (error) {
            toast.error("An error occurred while submitting the bill.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 relative">
            <button onClick={() => navigate(-1)} className="text-sm text-blue-600 hover:underline mb-6">&larr; Back to Orders</button>
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Bill (Admin View)</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 rounded-xl shadow-lg" ref={searchContainerRef}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Add Items to Bill</h2>
                            <button onClick={() => setShowCustomModal(true)} className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-100 transition">
                                <PlusIcon /> Custom Item
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onFocus={() => setIsSearchFocused(true)}
                                placeholder="Search for items by name..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-shadow"
                            />
                            {isSearchFocused && (
                                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 max-h-60 overflow-y-auto shadow-2xl">
                                    {searchResults.length > 0 ? searchResults.map(item => (
                                        <div key={item.id} onClick={() => handleAddItem(item)} className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors">
                                            <span>{item.name}</span>
                                            <span className="text-sm text-gray-500">₹{parseFloat(item.rate).toFixed(2)}/{item.unit}</span>
                                        </div>
                                    )) : (
                                        <p className="px-4 py-3 text-gray-500">No items found for '{vendor?.location}'.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg">
                        <h3 className="text-xl font-semibold text-gray-800 p-6 pb-4">Bill Summary</h3>
                        {billItems.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-left text-gray-500 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 pb-4 font-medium uppercase text-xs tracking-wider">Item</th>
                                            <th className="px-6 pb-4 font-medium text-center uppercase text-xs tracking-wider">Rate (₹)</th>
                                            <th className="px-6 pb-4 font-medium text-center uppercase text-xs tracking-wider">Qty/Wt</th>
                                            <th className="px-6 pb-4 font-medium text-right uppercase text-xs tracking-wider">Subtotal</th>
                                            <th className="px-6 pb-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {billItems.map((item) => (
                                            <tr key={item.billItemId} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-semibold text-gray-800">
                                                    {item.name}
                                                </td>
                                                <td className="px-6 py-4 w-32">
                                                    <input
                                                        type="number"
                                                        value={item.rateInput}
                                                        onChange={(e) => handleUpdateRate(item.billItemId, e.target.value)}
                                                        className="w-full text-center border border-gray-300 rounded-md p-2 font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 w-32">
                                                    <input
                                                        type="number"
                                                        value={item.weightInput}
                                                        onChange={(e) => handleUpdateWeight(item.billItemId, e.target.value)}
                                                        className="w-full text-center border border-gray-300 rounded-md p-2 font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-gray-900 text-lg">
                                                    ₹{item.total.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleRemoveItem(item.billItemId)} className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50">
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
                    <div className="bg-green-600 text-white p-6 rounded-xl shadow-lg text-center space-y-2 sticky top-6">
                        <p className="text-lg font-bold opacity-80 uppercase tracking-widest">Grand Total</p>
                        <p className="text-5xl font-extrabold tracking-tight">₹{totalBill.toFixed(2)}</p>
                    </div>
                    <button onClick={handleSubmitBill} disabled={isSubmitting || billItems.length === 0} className="w-full py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all text-lg disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl">
                        {isSubmitting ? 'Submitting Bill...' : 'Confirm & Complete Order'}
                    </button>
                </div>
            </div>

            {/* Admin Custom Item Modal */}
            {showCustomModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm relative">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Add Custom Scrap</h3>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Item Name</label>
                                <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Copper Wire" className="w-full mt-1 p-3 border border-gray-300 rounded-lg font-semibold text-gray-900 focus:border-blue-500 focus:ring-2" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Rate / Price (₹)</label>
                                <input type="number" value={customRate} onChange={(e) => setCustomRate(e.target.value)} placeholder="e.g. 50" className="w-full mt-1 p-3 border border-gray-300 rounded-lg font-semibold text-gray-900 focus:border-blue-500 focus:ring-2" />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowCustomModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-800 font-bold rounded-lg hover:bg-gray-200">
                                Cancel
                            </button>
                            <button onClick={handleAddCustom} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700">
                                Add Item
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProcess;