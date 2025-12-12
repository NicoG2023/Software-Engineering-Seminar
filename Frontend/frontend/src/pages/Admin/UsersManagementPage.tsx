// src/pages/Admin/UsersManagementPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { AuthApi } from '../../api/authApi';
import type { UserResponse, UserRole } from '../../types/auth';
import { useAuthStrict } from '../../auth/AuthContext';

const ROLE_ADMIN: UserRole = 'ADMIN';
const ROLE_CUSTOMER: UserRole = 'CUSTOMER';

const ROLE_BADGE = (role: UserRole) => {
  if (role === ROLE_ADMIN) {
    // Nuevo estilo más visible
    return 'bg-red-100 text-red-700 border-red-300';
  }
  if (role === ROLE_CUSTOMER) {
    return 'bg-blue-100 text-blue-700 border-blue-300';
  }
  return 'bg-gray-200 text-gray-700 border-gray-300';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          Users Management
        </h1>
        <button
          onClick={() => void fetchUsers()}
          disabled={loading}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-50"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search by username or email…"
          className="w-full sm:w-96 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <button
          onClick={() => void fetchUsers()}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-50"
        >
          Search
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-md">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">
                User
              </th>
              <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">
                Email
              </th>
              <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">
                State
              </th>
              <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">
                Role
              </th>
              <th className="px-4 py-3 text-left font-semibold border-b border-slate-200">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  Loading users…
                </td>
              </tr>
            )}

            {!loading && filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  There are no users matching your search.
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map(u => {
                const isAdmin = u.role === ROLE_ADMIN;
                const busy = !!busyIds[u.id];

                return (
                  <tr
                    key={u.id}
                    className="border-t border-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-900 font-medium">
                      {u.username || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {u.email || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                          u.enabled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border shadow-sm
                            ${
                              u.enabled
                                ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                : 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed`}
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
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
