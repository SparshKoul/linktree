import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Layers,
  Lock,
  Unlock,
  KeyRound,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  Check,
  AlertCircle,
  Copy,
  Mail,
  RefreshCw,
  LayoutGrid,
  ShoppingBag,
  X,
} from 'lucide-react';

export function SuperAdminDashboard({
  currentUser,
  onGoToWorkspace,
  onGoToDashboard,
  onLogout,
}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'clients' | 'blocked'

  // Provisioning Modal State
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [provisionLoading, setProvisionLoading] = useState(false);
  const [provisionError, setProvisionError] = useState('');
  const [provisionSuccess, setProvisionSuccess] = useState(null);

  // Change Password Modal State (Super Admin Only)
  const [changePasswordUser, setChangePasswordUser] = useState(null);
  const [updatePasswordVal, setUpdatePasswordVal] = useState('');
  const [updatePasswordLoading, setUpdatePasswordLoading] = useState(false);
  const [updatePasswordError, setUpdatePasswordError] = useState('');
  const [updatePasswordSuccess, setUpdatePasswordSuccess] = useState('');

  // Copied state
  const [copiedKey, setCopiedKey] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/users', { credentials: 'include' });
      if (!res.ok) {
        throw new Error('Failed to fetch clients list. Please ensure you are logged in as Super Admin.');
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBlock = async (user) => {
    if (user.isSuperAdmin || user.email?.toLowerCase() === 'sparshkoul6@gmail.com') {
      alert('Cannot block the Super Admin account.');
      return;
    }

    const nextBlocked = !user.isBlocked;
    const confirmMsg = nextBlocked
      ? `Are you sure you want to LOCK account ${user.email}? They will not be able to log in.`
      : `Unlock account ${user.email} and restore access?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}/block`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isBlocked: nextBlocked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user status');

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? {
                ...u,
                isBlocked: nextBlocked,
                account_state: nextBlocked ? 'locked' : 'active',
                accountState: nextBlocked ? 'locked' : 'active',
              }
            : u
        )
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (user) => {
    if (user.isSuperAdmin || user.email?.toLowerCase() === 'sparshkoul6@gmail.com') {
      alert('Cannot delete the Super Admin account.');
      return;
    }

    if (!window.confirm(`Delete client account ${user.email} and all associated cards? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete client');

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleProvisionSubmit = async (e) => {
    e.preventDefault();
    setProvisionError('');
    setProvisionSuccess(null);
    setProvisionLoading(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
          role: 'client',
          accountType: 'client',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to provision account');

      setProvisionSuccess({
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        slug: data.tree?.slug || newEmail.split('@')[0],
      });

      setNewEmail('');
      setNewPassword('');
      fetchUsers();
    } catch (err) {
      setProvisionError(err.message);
    } finally {
      setProvisionLoading(false);
    }
  };

  const handleUpdatePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!changePasswordUser) return;
    setUpdatePasswordError('');
    setUpdatePasswordSuccess('');
    setUpdatePasswordLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${changePasswordUser.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword: updatePasswordVal.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');

      setUpdatePasswordSuccess(`Password successfully updated for ${changePasswordUser.email}`);
      setTimeout(() => {
        setChangePasswordUser(null);
        setUpdatePasswordVal('');
        setUpdatePasswordSuccess('');
      }, 1500);
    } catch (err) {
      setUpdatePasswordError(err.message);
    } finally {
      setUpdatePasswordLoading(false);
    }
  };

  const handleCopyCredentials = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.trees && u.trees.some((t) => t.slug.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesSearch) return false;
    if (filterMode === 'clients') return !u.isSuperAdmin && u.role !== 'super_admin';
    if (filterMode === 'blocked') return u.isBlocked;
    return true;
  });

  const totalClients = users.filter((u) => !u.isSuperAdmin && u.role !== 'super_admin').length;
  const totalTrees = users.reduce((acc, u) => acc + (u.treesCount || u.trees?.length || 0), 0);
  const totalBlocked = users.filter((u) => u.isBlocked).length;

  return (
    <div className="flex-1 bg-[#F9FAFB] text-[#111111] overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-purple-200">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
              Super Admin Console
            </span>
            <span className="text-xs font-mono text-gray-500">sparshkoul6@gmail.com</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950 tracking-tight">
            Client & Multi-Card Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Manage clients on IndiaTaps, check active cards, provision accounts, and lock/unlock access.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setProvisionSuccess(null);
              setProvisionError('');
              setIsProvisionModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-full bg-[#1E2330] hover:bg-black text-[#D2E823] font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 text-[#00E575]" />
            <span>+ Provision Client</span>
          </button>

          <button
            onClick={fetchUsers}
            className="p-2.5 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 hover:text-black transition-colors cursor-pointer shadow-2xs"
            title="Refresh clients list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Clients */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Clients</div>
            <div className="text-3xl font-black text-gray-900 mt-1">{totalClients}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Accounts provisioned</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Total Digital Cards / Trees */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Cards on Site</div>
            <div className="text-3xl font-black text-gray-900 mt-1">{totalTrees}</div>
            <div className="text-[11px] text-purple-600 font-semibold mt-0.5">Live digital profiles</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Locked / Blocked */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Locked Accounts</div>
            <div className="text-3xl font-black text-gray-900 mt-1">{totalBlocked}</div>
            <div className="text-[11px] text-gray-500 font-semibold mt-0.5">Blocked from login</div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Quick Navigation to Workspace */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/90 shadow-2xs flex flex-col justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Card Workspace</div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={onGoToWorkspace}
              className="flex-1 py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Workspace</span>
            </button>
            <button
              onClick={onGoToDashboard}
              className="flex-1 py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-purple-200"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-purple-700" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-gray-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F6F6F7] border border-gray-200 text-xs w-full sm:max-w-md">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients by email, username, or card slug..."
            className="w-full bg-transparent focus:outline-none text-black font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-gray-400 hover:text-black text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex rounded-xl bg-[#F3F3F1] p-1 text-xs font-bold shrink-0">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterMode === 'all' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
            }`}
          >
            All Accounts ({users.length})
          </button>
          <button
            onClick={() => setFilterMode('clients')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterMode === 'clients' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
            }`}
          >
            Clients Only ({totalClients})
          </button>
          <button
            onClick={() => setFilterMode('blocked')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterMode === 'blocked' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'
            }`}
          >
            Locked ({totalBlocked})
          </button>
        </div>
      </div>

      {/* 4. Client Accounts Table */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAFBFB] border-b border-gray-200 text-gray-500 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Client / Account</th>
                <th className="py-3.5 px-4">Role & Status</th>
                <th className="py-3.5 px-4">Digital Cards Owned</th>
                <th className="py-3.5 px-4">Direct Card Links</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">
                    {loading ? 'Loading accounts...' : 'No client accounts found matching criteria.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSparsh = u.isSuperAdmin || u.email?.toLowerCase() === 'sparshkoul6@gmail.com';
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        u.isBlocked ? 'bg-red-50/30' : ''
                      }`}
                    >
                      {/* Client Account Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                              isSparsh
                                ? 'bg-purple-700 text-white'
                                : u.isBlocked
                                ? 'bg-red-200 text-red-800'
                                : 'bg-gray-200 text-gray-800'
                            }`}
                          >
                            {(u.email || 'U')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-gray-900 truncate flex items-center gap-1.5">
                              <span>{u.email}</span>
                              {isSparsh && (
                                <span className="text-[10px] bg-purple-100 text-purple-800 font-black px-1.5 py-0.5 rounded-md">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono">
                              ID: #{u.id} • username: @{u.username || 'client'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                              isSparsh
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {isSparsh ? (
                              <>
                                <ShieldCheck className="w-3 h-3 text-purple-700" />
                                Super Admin
                              </>
                            ) : (
                              'Client Account'
                            )}
                          </span>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono uppercase tracking-wide ${
                              u.account_state === 'locked' || u.isBlocked
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {u.account_state === 'locked' || u.isBlocked ? (
                              <>
                                <Lock className="w-2.5 h-2.5" />
                                <span>Locked</span>
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00E575] animate-pulse" />
                                <span>Active</span>
                              </>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Cards Count */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-900 border border-gray-200">
                            {u.treesCount || u.trees?.length || 0} card{(u.treesCount || u.trees?.length || 0) === 1 ? '' : 's'}
                          </span>
                        </div>
                      </td>

                      {/* Direct Card Links */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {u.trees && u.trees.length > 0 ? (
                            u.trees.map((t) => (
                              <a
                                key={t.id}
                                href={`/${t.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 hover:bg-[#D2E823] hover:text-[#1E3A1E] text-gray-700 border border-gray-200 font-mono text-[11px] font-bold transition-colors cursor-pointer group"
                                title={`Open /${t.slug}`}
                              >
                                <span>/{t.slug}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-gray-400 group-hover:text-[#1E3A1E]" />
                              </a>
                            ))
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">No cards created yet</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Change Password (Super Admin Only Capability) */}
                          <button
                            type="button"
                            onClick={() => {
                              setChangePasswordUser(u);
                              setUpdatePasswordVal('');
                              setUpdatePasswordError('');
                              setUpdatePasswordSuccess('');
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200 hover:border-gray-300"
                            title={`Change password for ${u.email}`}
                          >
                            <KeyRound className="w-3.5 h-3.5 text-gray-600" />
                            <span className="hidden sm:inline">Password</span>
                          </button>

                          {!isSparsh && (
                            <>
                              {/* Lock / Unlock Toggle */}
                              <button
                                type="button"
                                onClick={() => handleToggleBlock(u)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                                  u.isBlocked
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                                }`}
                                title={u.isBlocked ? 'Unlock client access' : 'Lock client account'}
                              >
                                {u.isBlocked ? (
                                  <>
                                    <Unlock className="w-3.5 h-3.5" />
                                    <span>Unlock</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>Lock</span>
                                  </>
                                )}
                              </button>

                              {/* Delete Client */}
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-200"
                                title="Delete Client Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Provision Client Modal */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative space-y-4 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsProvisionModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-black transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1.5">
              <div className="w-11 h-11 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-xs">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-gray-950 tracking-tight">
                Provision New Client Account
              </h2>
              <p className="text-xs text-gray-500">
                Create login credentials for a paying client. They can log in and create unlimited cards.
              </p>
            </div>

            {provisionError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{provisionError}</span>
              </div>
            )}

            {provisionSuccess ? (
              <div className="space-y-3.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950">
                <div className="flex items-center gap-2 font-black text-sm text-emerald-900">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Client Created Successfully!</span>
                </div>
                <div className="space-y-1.5 bg-white p-3 rounded-xl border border-emerald-200/80 font-mono text-[11px]">
                  <div><span className="text-gray-400">Email:</span> <strong>{provisionSuccess.email}</strong></div>
                  <div><span className="text-gray-400">Password:</span> <strong>{provisionSuccess.password}</strong></div>
                  <div><span className="text-gray-400">Initial Card:</span> <strong>indiataps.vercel.app/{provisionSuccess.slug}</strong></div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyCredentials(
                        `IndiaTaps Client Login Credentials:\nEmail: ${provisionSuccess.email}\nPassword: ${provisionSuccess.password}\nLogin at: ${window.location.origin}`,
                        'creds'
                      )
                    }
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {copiedKey === 'creds' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'creds' ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProvisionSuccess(null);
                      setIsProvisionModalOpen(false);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-white border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProvisionSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Client Email
                  </label>
                  <div className="flex items-center px-3.5 py-2.5 rounded-2xl bg-[#F6F6F7] border border-gray-200 text-xs">
                    <Mail className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="client@company.com"
                      className="w-full bg-transparent focus:outline-none text-black font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Client Password
                  </label>
                  <div className="flex items-center px-3.5 py-2.5 rounded-2xl bg-[#F6F6F7] border border-gray-200 text-xs">
                    <Lock className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter secure password (min 6 characters)"
                      className="w-full bg-transparent focus:outline-none text-black font-medium"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProvisionModalOpen(false)}
                    className="flex-1 py-3 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={provisionLoading}
                    className="flex-1 py-3 rounded-full bg-[#1E2330] hover:bg-black text-[#D2E823] font-bold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#00E575]" />
                    <span>{provisionLoading ? 'Creating...' : 'Create Account'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 6. Change / Update User Password Modal (Super Admin ONLY) */}
      {changePasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 relative space-y-4 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setChangePasswordUser(null);
                setUpdatePasswordVal('');
                setUpdatePasswordError('');
                setUpdatePasswordSuccess('');
              }}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-black transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-purple-700" />
                Super Admin Privilege
              </span>
              <h2 className="text-xl font-extrabold text-gray-950 mt-1.5">
                Update Account Password
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Directly overwrite the password for <span className="font-bold text-gray-900">{changePasswordUser.email}</span>.
              </p>
            </div>

            {updatePasswordError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{updatePasswordError}</span>
              </div>
            )}

            {updatePasswordSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{updatePasswordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  New Password
                </label>
                <div className="flex items-center px-3.5 py-2.5 rounded-2xl bg-[#F6F6F7] border border-gray-200 text-xs">
                  <Lock className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    required
                    value={updatePasswordVal}
                    onChange={(e) => setUpdatePasswordVal(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="w-full bg-transparent focus:outline-none text-black font-medium"
                    minLength={6}
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Plaintext visible so you can verify and securely share with the client.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setChangePasswordUser(null);
                    setUpdatePasswordVal('');
                    setUpdatePasswordError('');
                    setUpdatePasswordSuccess('');
                  }}
                  className="flex-1 py-2.5 rounded-full border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatePasswordLoading || !updatePasswordVal.trim()}
                  className="flex-1 py-2.5 rounded-full bg-[#1E2330] hover:bg-black text-[#D2E823] font-bold text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {updatePasswordLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <KeyRound className="w-3.5 h-3.5 text-[#00E575]" />
                  )}
                  <span>{updatePasswordLoading ? 'Updating...' : 'Set Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
