import { useState } from 'react';
import { X, Lock, Mail, User, AlertCircle, ArrowRight, Check } from 'lucide-react';

export function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'login', currentUser, onLogout }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup' | 'switch'
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sign in');

      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create account');

      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickLoginAs = async (id, pwd) => {
    setIdentifier(id);
    setPassword(pwd);
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: id, password: pwd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sign in');
      onAuthSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-[32px] w-full max-w-sm p-6 sm:p-8 space-y-6 text-[#111111] shadow-2xl relative border border-gray-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Linktree Asterisk Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center mx-auto shadow-md">
            <span className="text-xl font-black text-[#00E575] leading-none">✱</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            {currentUser && mode === 'switch'
              ? 'Account & Settings'
              : mode === 'signup'
              ? 'Create your Linktree'
              : 'Sign in to Linktree'}
          </h2>
          <p className="text-xs text-gray-500">
            {currentUser && mode === 'switch'
              ? `Signed in as @${currentUser.username || 'riyast'}`
              : mode === 'signup'
              ? 'Join millions claiming their corner of the internet'
              : 'Log in to manage your trees, links and settings'}
          </p>
        </div>

        {/* Current user active card if logged in */}
        {currentUser && mode === 'switch' && (
          <div className="p-4 rounded-2xl bg-[#F6F6F7] border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D1D5DB] flex items-center justify-center overflow-hidden">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-xs text-black">@{currentUser.username}</div>
                  <div className="text-[11px] text-gray-400 font-mono">{currentUser.email}</div>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full bg-white">
                Active
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => setMode('login')}
                className="flex-1 py-2 px-3 rounded-full border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors"
              >
                Switch account
              </button>
              <button
                onClick={() => {
                  onLogout();
                  setMode('login');
                }}
                className="flex-1 py-2 px-3 rounded-full bg-red-50 hover:bg-red-100 text-xs font-bold text-red-600 transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        )}

        {/* Mode Selector (Sign In vs Create Account) */}
        {mode !== 'switch' && (
          <div className="flex rounded-full bg-[#F3F3F1] p-1 text-xs font-bold">
            <button
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-2 rounded-full transition-all cursor-pointer ${
                mode === 'login' ? 'bg-white shadow-xs text-black font-extrabold' : 'text-gray-500 hover:text-black'
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setError('');
              }}
              className={`flex-1 py-2 rounded-full transition-all cursor-pointer ${
                mode === 'signup' ? 'bg-white shadow-xs text-black font-extrabold' : 'text-gray-500 hover:text-black'
              }`}
            >
              Create account
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Username or Email
              </label>
              <div className="flex items-center px-3.5 py-2.5 rounded-2xl bg-[#F6F6F7] border border-gray-200 text-xs">
                <Mail className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="riyast or sparshkoul6@gmail.com"
                  className="w-full bg-transparent focus:outline-none text-black font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Password
              </label>
              <div className="flex items-center px-3.5 py-2.5 rounded-2xl bg-[#F6F6F7] border border-gray-200 text-xs">
                <Lock className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent focus:outline-none text-black font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            {/* Quick Demo Accounts Switcher */}
            <div className="pt-2 text-center space-y-1.5 border-t border-gray-100">
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
                Quick 1-Click Switch:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => quickLoginAs('riyast', 'password123')}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-800 transition-colors cursor-pointer"
                >
                  @riyast (3 trees)
                </button>
                <button
                  type="button"
                  onClick={() => quickLoginAs('alex', 'password123')}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-800 transition-colors cursor-pointer"
                >
                  @alex (1 tree)
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Signup Form */}
        {mode === 'signup' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Username (Your linktr.ee URL)
              </label>
              <div className="flex items-center px-3.5 py-2.5 rounded-2xl bg-[#F6F6F7] border border-gray-200 text-xs">
                <span className="text-gray-400 font-mono mr-1">linktr.ee/</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="yourname"
                  className="w-full bg-transparent focus:outline-none text-black font-bold font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Email
              </label>
              <div className="flex items-center px-3.5 py-2.5 rounded-2xl bg-[#F6F6F7] border border-gray-200 text-xs">
                <Mail className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full bg-transparent focus:outline-none text-black font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Password
              </label>
              <div className="flex items-center px-3.5 py-2.5 rounded-2xl bg-[#F6F6F7] border border-gray-200 text-xs">
                <Lock className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full bg-transparent focus:outline-none text-black font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Creating account...' : 'Create account & Linktree'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
