// src/pages/Admin/UsersManagementPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { AuthApi } from '../../api/authApi';
import type { UserResponse, UserRole } from '../../types/auth';
import { useAuthStrict } from '../../auth/AuthContext';

const ROLE_ADMIN: UserRole = 'ADMIN';
const ROLE_CUSTOMER: UserRole = 'CUSTOMER';

// Badge styles per role
const ROLE_BADGE = (role: UserRole) => {
  if (role === ROLE_ADMIN) {
    return 'bg-[#D90429]/15 text-[#FFDA63] border-[#D90429]/40';
  }
  if (role === ROLE_CUSTOMER) {
    return 'bg-blue-600/20 text-blue-300 border-blue-500/40';
  }
  return 'bg-[#333333] text-white border-[#333333]';
};

export default function UsersManagementPage() {
  const { authenticated } = useAuthStrict();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [q, setQ] = useState('');
  const [busyIds, setBusyIds] = useState<Record<number, boolean>>({});

  const markBusy = (id: number, v: boolean) =>
    setBusyIds(prev => ({ ...prev, [id]: v }));

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const list = await AuthApi.listUsers();
      setUsers(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      void fetchUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated]);

  const filtered = useMemo(() => {
    if (!q) return users;
    const s = q.toLowerCase();
    return users.filter(
      u =>
        u.username.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s),
    );
  }, [users, q]);

  const toggleEnabled = async (u: UserResponse) => {
    if (u.role === ROLE_ADMIN) return; // do not disable admins
    markBusy(u.id, true);
    try {
      const updated = await AuthApi.setEnabled(u.id, !u.enabled);
      setUsers(prev =>
        prev.map(x => (x.id === u.id ? updated : x)),
      );
    } finally {
      markBusy(u.id, false);
    }
  };

  // Promote CUSTOMER → ADMIN
  const makeAdmin = async (u: UserResponse) => {
    if (u.role === ROLE_ADMIN) return;
    markBusy(u.id, true);
    try {
      const updated = await AuthApi.changeRole(u.id, ROLE_ADMIN);
      setUsers(prev =>
        prev.map(x => (x.id === u.id ? updated : x)),
      );
    } finally {
      markBusy(u.id, false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Users Management</h1>
        <button
          onClick={() => void fetchUsers()}
          disabled={loading}
          className="rounded-lg px-4 py-2 font-medium text-[#1E1E1E] bg-[#FFDA63] hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by username or email…"
          className="w-full md:w-96 rounded-lg border border-[#333333] bg-[#1E1E1E] px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFDA63]"
        />
        <button
          onClick={() => void fetchUsers()}
          className="rounded-lg px-4 py-2 font-medium text-white bg-[#D90429] hover:opacity-90"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-[#333333] bg-[#1E1E1E]">
        <table className="min-w-full text-sm">
          <thead className="bg-[#333333] text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">User</th>
              <th className="px-4 py-3 text-left font-semibold">Email</th>
              <th className="px-4 py-3 text-left font-semibold">State</th>
              <th className="px-4 py-3 text-left font-semibold">Role</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-white/80">
                  Loading users…
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-white/60">
                  There are no users matching your search.
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map(u => {
                const isAdmin = u.role === ROLE_ADMIN;
                const busy = !!busyIds[u.id];

                return (
                  <tr key={u.id} className="border-t border-[#333333]">
                    <td className="px-4 py-3 text-white font-medium">
                      {u.username || '—'}
                    </td>
                    <td className="px-4 py-3 text-white/90">
                      {u.email || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          u.enabled
                            ? 'bg-green-700/30 text-green-300'
                            : 'bg-gray-600/40 text-gray-300'
                        }`}
                      >
                        {u.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full border ${ROLE_BADGE(
                          u.role,
                        )}`}
                      >
                        {u.role === ROLE_ADMIN ? 'Admin' : 'Customer'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => void toggleEnabled(u)}
                          disabled={busy || isAdmin}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border
                            ${
                              u.enabled
                                ? 'bg-transparent text-white border-white/30 hover:bg-white/10'
                                : 'bg-[#D90429] text-white border-[#D90429] hover:opacity-90'
                            }
                            disabled:opacity-50`}
                          title={
                            isAdmin
                              ? 'You cannot enable/disable an administrator.'
                              : ''
                          }
                        >
                          {u.enabled ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
                          onClick={() => void makeAdmin(u)}
                          disabled={busy || isAdmin}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FFDA63] text-[#1E1E1E] hover:opacity-90 border border-[#FFDA63] disabled:opacity-50"
                          title={
                            isAdmin ? 'Already admin' : 'Promote to admin'
                          }
                        >
                          Make Admin
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
