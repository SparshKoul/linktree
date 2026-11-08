import { useState, useEffect } from 'react';
import { X, Lock, Mail, User, AlertCircle, ArrowRight, Check, Plus, LogOut, ArrowLeft, ShieldCheck } from 'lucide-react';

export function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'login', currentUser, onLogout, treesCount = 0 }) {
  const [mode, setMode] = useState(currentUser ? 'dashboard' : initialMode); // 'dashboard' | 'login' | 'signup'
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMsg('');
      if (initialMode === 'signup') {
        setMode('signup');
      } else if (currentUser) {
        setMode('dashboard');
      } else {
        setMode('login');
      }
    }
  }, [isOpen, initialMode, currentUser]);

  if (!isOpen) return null;

  const isGoogleAccount = currentUser?.email && (
    currentUser.email.endsWith('@gmail.com') ||
    currentUser.email.includes('google')
  );

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/google?redirect_to=${encodeURIComponent(window.location.origin)}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Google authentication service unavailable');
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

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
      let data = {};
      try {
        data = await res.json();
      } catch {
        throw new Error('Server connection error. Please make sure the backend is running.');
      }
      if (!res.ok) throw new Error(data.error || 'Failed to sign in');

      onAuthSuccess(data.user);
      setSuccessMsg(`Logged in as @${data.user.username}`);
      setMode('dashboard');
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
      let data = {};
      try {
        data = await res.json();
      } catch {
        throw new Error('Server connection error. Please make sure the backend is running.');
      }
      if (!res.ok) throw new Error(data.error || 'Failed to create account');

      onAuthSuccess(data.user);
      setSuccessMsg(`Account created for @${data.user.username}`);
      setMode('dashboard');
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
      setSuccessMsg(`Switched to @${data.user.username}`);
      setMode('dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startCreateAccount = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setError('');
    setSuccessMsg('');
    setMode('signup');
  };

  const startSwitchAccount = () => {
    setIdentifier('');
    setPassword('');
    setError('');
    setSuccessMsg('');
    setMode('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-[32px] w-full max-w-sm p-6 sm:p-8 space-y-5 text-[#111111] shadow-2xl relative border border-gray-100">
        {/* Top bar with back button if logged in & in login/signup mode */}
        {currentUser && mode !== 'dashboard' && (
          <button
            onClick={() => setMode('dashboard')}
            className="absolute top-5 left-5 flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-black py-1 px-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Linktree Asterisk Header */}
        <div className="text-center space-y-1.5 pt-2">
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center mx-auto shadow-md relative">
            <span className="text-xl font-black text-[#00E575] leading-none">✱</span>
            {currentUser && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#00E575] border-2 border-white ring-2 ring-[#00E575]/20" />
            )}
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            {mode === 'dashboard'
              ? 'Account Dashboard'
              : mode === 'signup'
              ? 'Create a new account'
              : 'Sign in to Linktree'}
          </h2>
          <p className="text-xs text-gray-500">
            {mode === 'dashboard'
              ? 'You are logged in & verified'
              : mode === 'signup'
              ? 'Create as many accounts as you want'
              : 'Log in to manage your trees, links and settings'}
          </p>
        </div>

        {/* Success Banner */}
        {successMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* DASHBOARD MODE: SHOWS LOGGED-IN IDENTITY, GOOGLE ID, MULTI-ACCOUNT CREATION */}
        {mode === 'dashboard' && currentUser && (
          <div className="space-y-4">
            {/* Active User Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-[#FAFBFB] to-[#F3F4F6] border border-gray-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs relative">
                    {(currentUser.username || 'U')[0].toUpperCase()}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#00E575] border-2 border-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-black truncate">@{currentUser.username}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">linktr.ee/{currentUser.username}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E575] animate-pulse" />
                  Logged in
                </span>
              </div>

              {/* Google ID / Account Email Section */}
              <div className="p-2.5 rounded-xl bg-white border border-gray-200/80 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <span className="flex items-center gap-1">
                    {isGoogleAccount ? (
                      <>
                        <svg className="w-3 h-3" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Google ID</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3 h-3 text-purple-600" />
                        <span>Account Email</span>
                      </>
                    )}
                  </span>
                  <span className="text-emerald-600 flex items-center gap-0.5 lowercase font-mono">
                    <Check className="w-2.5 h-2.5 stroke-[3]" /> verified
                  </span>
                </div>
                <div className="font-mono text-xs font-bold text-gray-900 truncate">
                  {currentUser.email || 'sparshkoul6@gmail.com'}
                </div>
              </div>
            </div>

            {/* Multi-Account Buttons: User can create as many accounts as possible */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={startCreateAccount}
                className="w-full py-2.5 px-4 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create another account</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startSwitchAccount}
                  className="flex-1 py-2 px-3 rounded-full border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                >
                  Switch account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setMode('login');
                  }}
                  className="flex-1 py-2 px-3 rounded-full bg-red-50 hover:bg-red-100 text-xs font-bold text-red-600 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            </div>

            {/* Quick 1-Click Switch: Switch to existing accounts instantly */}
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
                  @riyast (Primary)
                </button>
                <button
                  type="button"
                  onClick={() => quickLoginAs('alex', 'password123')}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-800 transition-colors cursor-pointer"
                >
                  @alex (Creator)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOGIN / SIGNUP MODE */}
        {mode !== 'dashboard' && (
          <div className="space-y-3.5">
            {/* Google Sign-in Option */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-full border border-gray-200/90 hover:bg-gray-50 flex items-center justify-center gap-2.5 text-xs font-bold text-gray-800 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-2 text-[10px] uppercase font-bold text-gray-400 shrink-0">
                or with email
              </span>
              <div className="border-t border-gray-200 w-full" />
            </div>

            {/* Toggle between Sign In & Create Account */}
            <div className="flex rounded-full bg-[#F3F3F1] p-1 text-xs font-bold">
              <button
                type="button"
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
                type="button"
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

            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3">
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
                      placeholder="riyast or user@example.com"
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
              </form>
            )}

            {/* SIGNUP FORM: Create unlimited new accounts */}
            {mode === 'signup' && (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    New Username (Your linktr.ee URL)
                  </label>
                  <div className="flex items-center px-3.5 py-2.5 rounded-2xl bg-[#F6F6F7] border border-gray-200 text-xs">
                    <span className="text-gray-400 font-mono mr-1">linktr.ee/</span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="newuser"
                      className="w-full bg-transparent focus:outline-none text-black font-bold font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Email address
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

            {/* Quick 1-Click Switch: Switch to existing accounts */}
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
                  @riyast
                </button>
                <button
                  type="button"
                  onClick={() => quickLoginAs('alex', 'password123')}
                  className="flex-1 py-1.5 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-800 transition-colors cursor-pointer"
                >
                  @alex
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
