// src/pages/rooms/RoomList.tsx
import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { theaterRoomApi } from '../../../api/theaterRoomApi';
import type { TheaterRoom } from '../../../api/theaterRoomApi';

const RoomList: React.FC = () => {
  const [rooms, setRooms] = useState<TheaterRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [nameFilter, setNameFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>(''); // '', 'active', 'inactive'

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await theaterRoomApi.getAll();
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await theaterRoomApi.delete(id);
        await fetchRooms();
      } catch (error) {
        console.error('Error deleting room:', error);
      }
    }
  };

  const handleRefresh = () => {
    fetchRooms();
  };

  // Filtro en frontend
  const filteredRooms = rooms.filter((room) => {
    const matchesName =
      !nameFilter.trim() ||
      room.name.toLowerCase().includes(nameFilter.trim().toLowerCase());
    const matchesLocation =
      !locationFilter.trim() ||
      (room.location ?? '')
        .toLowerCase()
        .includes(locationFilter.trim().toLowerCase());
    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'active' && room.is_active) ||
      (statusFilter === 'inactive' && !room.is_active);

    return matchesName && matchesLocation && matchesStatus;
  });

  return (
    <main className="py-10 px-4">
      <section className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Theater Rooms
            </h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-[0.15em]">
              Admin management
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            {/* Refresh */}
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 text-sm font-semibold px-4 py-2 text-slate-700 bg-white hover:bg-slate-100 transition shadow-sm"
            >
              ⟳ Refresh
            </button>

            <RouterLink
              to="/rooms/new"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 text-white text-sm font-semibold px-4 py-2 shadow hover:bg-indigo-700 transition"
            >
              <span className="mr-1 text-lg">＋</span>
              <span>Add Room</span>
            </RouterLink>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Filter Rooms</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.5fr)]">
            {/* Name filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-[0.15em]">
                Name
              </label>
              <input
                type="text"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Search by room name..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Location filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-[0.15em]">
                Location
              </label>
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="Search by location..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-[0.15em]">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                {['ID', 'Name', 'Capacity', 'Location', 'Status', 'Actions'].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-3 font-semibold text-slate-700 border-b border-slate-200"
                    >
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                    No rooms found
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => (
                  <tr
                    key={room.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 border-b border-slate-200 text-slate-700">
                      {room.id}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-200 text-slate-900">
                      {room.name}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-200 text-slate-700">
                      {room.capacity}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-200 text-slate-700">
                      {room.location ?? '—'}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-200">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                          room.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        {room.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-4 py-3 border-b border-slate-200 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <RouterLink
                          to={`/rooms/edit/${room.id}`}
                          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 hover:bg-indigo-700 transition"
                        >
                          ✏️ Edit
                        </RouterLink>

                        <button
                          type="button"
                          onClick={() => handleDelete(room.id)}
                          className="inline-flex items-center justify-center rounded-lg bg-rose-600 text-white text-xs font-semibold px-3 py-1.5 hover:bg-rose-700 transition"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default RoomList;
