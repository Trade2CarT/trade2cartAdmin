import React, { useState } from 'react';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../firebase';
import { toast } from 'react-toastify';
import logo from '../assets/images/logo.PNG';

const Loader = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>;

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        }
        catch {
            toast.error('Login Failed. Please check your credentials.');
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100 px-4">
            <div className="w-full max-w-md">
                {/* Brand header */}
                <div className="flex flex-col items-center mb-6">
                    <img src={logo} alt="Trade2Cart" className="w-20 h-20 rounded-2xl shadow-md border border-slate-100 bg-white p-1.5" />
                    <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-900">
                        Trade<span className="text-accent-500">2</span>Cart
                    </h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Admin Console</p>
                </div>

                <div className="p-8 bg-white rounded-3xl shadow-xl border border-slate-100">
                    <h2 className="text-lg font-black text-slate-800 mb-1">Sign in to continue</h2>
                    <p className="text-sm text-slate-400 font-medium mb-6">Authorized administrators only.</p>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-slate-500">Email</label>
                            <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@trade2cart.in" className="w-full px-4 py-3 mt-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition" />
                        </div>
                        <div>
                            <label htmlFor="password" className="text-xs font-black uppercase tracking-wider text-slate-500">Password</label>
                            <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 mt-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-3.5 rounded-xl text-sm font-black text-white bg-brand-600 hover:bg-brand-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:bg-slate-300 transition-all shadow-md shadow-brand-600/25">
                            {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Sign In'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-[11px] font-bold text-slate-400 mt-6 uppercase tracking-widest">Trade2Cart · Smart Scrap Marketplace</p>
            </div>
        </div>
    );
};

export default AdminLogin;
