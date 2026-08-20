import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../shared/api';
import { Coffee, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        navigate('/admin/orders');
      } else {
        setError(res.data.error || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials or connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-secondary p-4 font-sans text-slate-100">
      <div className="w-full max-w-md bg-slate-950 border border-slate-900 rounded-card p-8 shadow-2xl relative">
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-3 bg-secondary rounded-full border border-primary/20 mb-3">
            <Coffee className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-wider text-white">MOMOJI</h1>
          <p className="font-mono text-[10px] text-accent mt-1">REAL-TIME MANAGEMENT LOGIN</p>
        </div>

        {error && (
          <div className="bg-red-950/60 border border-red-900/50 text-red-200 text-xs font-mono p-3 rounded-2xl mb-5 flex items-start space-x-2">
            <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] text-accent uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-accent" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@momoji.com"
                required
                className="w-full bg-secondary border border-slate-800 rounded-full py-3 pl-11 pr-4 text-sm font-mono focus:border-primary focus:outline-none transition-colors text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-mono text-[11px] text-accent uppercase">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-accent" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-secondary border border-slate-800 rounded-full py-3 pl-11 pr-4 text-sm font-mono focus:border-primary focus:outline-none transition-colors text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-secondary font-mono font-bold rounded-full py-3.5 text-sm tracking-wider flex justify-center items-center hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:scale-100 transition-all shadow-md mt-6"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>SIGNING IN...</span>
              </>
            ) : (
              <span>SIGN IN</span>
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-900 pt-4 text-center">
          <p className="text-[10px] font-mono text-accent">
            Secure admin portal • Cookie Session Authentication
          </p>
        </div>
      </div>
    </div>
  );
}
