import { useState, useEffect } from 'react';
import { X, Lock, Mail, User, AlertCircle, ArrowRight, Check, Plus, LogOut, ArrowLeft, ShieldCheck, Layers } from 'lucide-react';

export function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
  currentUser,
  onLogout,
  treesCount = 0,
  onOpenCreateTree,
}) {
  const isSuper = Boolean(
    currentUser && (
      currentUser.isSuperAdmin ||
      currentUser.role === 'super_admin' ||
      currentUser.accountType === 'super_admin' ||
      currentUser.email?.toLowerCase() === 'sparshkoul6@gmail.com'
    )
  );

  const [mode, setMode] = useState(currentUser ? 'dashboard' : 'login'); // 'dashboard' | 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccessMsg('');
      if (initialMode === 'signup' && isSuper) {
        setMode('signup');
      } else if (currentUser) {
        setMode('dashboard');
      } else {
        setMode('login');
      }
    }
  }, [isOpen, initialMode, currentUser, isSuper]);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        throw new Error('Server connection error. Please make sure the backend is running.');
      }
      if (!res.ok) throw new Error(data.error || 'Failed to sign in');

      onAuthSuccess(data.user);
      setSuccessMsg(`Logged in as ${data.user.email}`);
      setMode('dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e?.preventDefault();
    if (!isSuper) {
      setError('Public self-registration is disabled. Only the Super Admin (sparshkoul6@gmail.com) can provision client accounts.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, role: 'client', accountType: 'client' }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        throw new Error('Server connection error. Please make sure the backend is running.');
      }
      if (!res.ok) throw new Error(data.error || 'Failed to provision client account');

      setSuccessMsg(`Account provisioned successfully for ${data.user?.email || email}`);
      setEmail('');
      setPassword('');
      setTimeout(() => setMode('dashboard'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const startCreateAccount = () => {
    setEmail('');
    setPassword('');
    setError('');
    setSuccessMsg('');
    setMode('signup');
  };

  const startSwitchAccount = () => {
    setEmail('');
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

        {/* IndiaTaps Asterisk Header */}
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
              ? (isSuper ? 'Provision Client Account' : 'Account Registration')
              : 'Sign in to IndiaTaps'}
          </h2>
          <p className="text-xs text-gray-500">
            {mode === 'dashboard'
              ? (isSuper ? 'Super Admin Console' : 'Authorized IndiaTaps Account')
              : mode === 'signup'
              ? (isSuper ? 'Enter client email and password to create account' : 'Registration is restricted to Super Admin')
              : 'Sign in with your email and password'}
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

        {/* DASHBOARD MODE: SHOWS ACCOUNT EMAIL, DIGITAL CARDS COUNT, MULTI-CARD CREATION */}
        {mode === 'dashboard' && currentUser && (
          <div className="space-y-4">
            {/* Active User Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-[#FAFBFB] to-[#F3F4F6] border border-gray-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs relative">
                    {(currentUser.email || 'A')[0].toUpperCase()}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#00E575] border-2 border-white" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-sm text-black truncate block">
                      {currentUser.email}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      Account #{currentUser.id || 1}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 ${
                  isSuper
                    ? 'text-purple-800 bg-purple-100 border border-purple-300'
                    : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                }`}>
                  {isSuper ? <ShieldCheck className="w-3 h-3 text-purple-600" /> : <span className="w-1.5 h-1.5 rounded-full bg-[#00E575] animate-pulse" />}
                  {isSuper ? 'Super Admin' : 'Client Account'}
                </span>
              </div>

              {/* Cards Count Banner: Person can make as many cards as possible */}
              <div className="p-3 rounded-xl bg-white border border-gray-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">
                      {treesCount} Digital Card{treesCount === 1 ? '' : 's'} Created
                    </div>
                    <div className="text-[10px] text-gray-400">
                      Unlimited cards allowed under this account
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions: Create another card under this account */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCreateTree?.();
                }}
                className="w-full py-2.5 px-4 rounded-full bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create new Digital Card</span>
              </button>

              {isSuper && (
                <button
                  type="button"
                  onClick={startCreateAccount}
                  className="w-full py-2.5 px-4 rounded-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Provision New Client Account</span>
                </button>
              )}
            </div>

            {/* Navigation & Logout Buttons */}
            <div className="flex items-center gap-2 pt-1">
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
                  onClose();
                }}
                className="flex-1 py-2 px-3 rounded-full bg-red-50 hover:bg-red-100 text-xs font-bold text-red-600 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            </div>


          </div>
        )}

        {/* LOGIN / SIGNUP MODE */}
        {mode !== 'dashboard' && (
          <div className="space-y-3.5">
            {/* If super admin, allow toggling to Provision Client Account. If not, only allow Login */}
            {isSuper ? (
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
                  Provision Client
                </button>
              </div>
            ) : null}

            {/* LOGIN FORM (Email + Password only) */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3">
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

                {!currentUser && (
                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-[11px] text-gray-500 text-center leading-relaxed">
                    <p className="font-semibold text-gray-700">Invite-Only Access</p>
                    <p className="mt-0.5">
                      Client accounts are provisioned exclusively by Super Admin (<span className="font-mono text-gray-700">sparshkoul6@gmail.com</span>). Under your account, you can create and manage unlimited digital cards.
                    </p>
                  </div>
                )}
              </form>
            )}

            {/* SUPER ADMIN CLIENT PROVISIONING FORM (Email + Password only) */}
            {mode === 'signup' && isSuper && (
              <form onSubmit={handleRegister} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Client Email
                  </label>
                  <div className="flex items-center px-3.5 py-2.5 rounded-2xl bg-[#F6F6F7] border border-gray-200 text-xs">
                    <Mail className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@restaurant.com"
                      className="w-full bg-transparent focus:outline-none text-black font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Initial Password
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
                  className="w-full py-3 rounded-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Provisioning client...' : 'Provision Client Account'}
                </button>
              </form>
            )}


          </div>
        )}
      </div>
    </div>
  );
}
