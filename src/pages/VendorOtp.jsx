import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ref, get } from 'firebase/database';
import { db } from '../firebase';

const VendorOtp = () => {
    const { vendorId, assignmentId } = useParams();
    const navigate = useNavigate();
    const [otp, setOtp] = useState(new Array(4).fill(''));
    const [loading, setLoading] = useState(false);
    const inputsRef = useRef([]);

    useEffect(() => {
        inputsRef.current[0]?.focus();
    }, []);

    const handleChange = (e, index) => {
        const { value } = e.target;
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 3) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async () => {
        const enteredOtp = otp.join('');
        if (enteredOtp.length !== 4) {
            return toast.error('Please enter the 4-digit OTP.');
        }
        setLoading(true);

        try {
            const assignmentRef = ref(db, `assignments/${assignmentId}`);
            const assignmentSnapshot = await get(assignmentRef);

            if (!assignmentSnapshot.exists()) {
                throw new Error("Assignment not found.");
            }

            const assignmentData = assignmentSnapshot.val();

            if (assignmentData.vendorId !== vendorId) {
                throw new Error("This order is not assigned to the selected vendor.");
            }

            const userRef = ref(db, `users/${assignmentData.userId}`);
            const userSnapshot = await get(userRef);

            if (!userSnapshot.exists()) {
                throw new Error("Customer data not found.");
            }

            const userData = userSnapshot.val();

            if (String(userData.otp) === String(enteredOtp)) {
                toast.success("OTP Verified!");
                navigate(`/admin-process/${assignmentId}`);
            } else {
                toast.error("Invalid OTP. Please try again.");
            }

        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-sm mx-auto bg-white p-8 rounded-2xl shadow-lg text-center">
                <h2 className="text-2xl font-bold text-gray-800">Verify Customer OTP</h2>
                <p className="text-gray-500 mt-2 mb-6">Enter the 4-digit OTP from the customer to proceed.</p>

                <div className="flex justify-center gap-2 mb-6">
                    {otp.map((data, index) => (
                        <input
                            key={index}
                            ref={el => inputsRef.current[index] = el}
                            type="text"
                            maxLength="1"
                            className="w-12 h-14 text-center text-2xl font-semibold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={data}
                            onChange={(e) => handleChange(e, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                        />
                    ))}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 disabled:bg-gray-400"
                >
                    {loading ? 'Verifying...' : 'Verify & Create Bill'}
                </button>
            </div>
        </div>
    );
};

export default VendorOtp;