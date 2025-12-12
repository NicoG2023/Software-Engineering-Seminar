// src/pages/rooms/RoomForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { theaterRoomApi, type TheaterRoom } from '../../../api/theaterRoomApi';

type RoomFormState = {
  name: string;
  capacity: string; // string en el form, number al enviar
  location: string;
  is_active: boolean;
};

const RoomForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<RoomFormState>({
    name: '',
    capacity: '',
    location: '',
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar sala en modo edición
  const fetchRoom = useCallback(async () => {
    if (!id) return;
    try {
      setLoadingInitial(true);
      const room: TheaterRoom = await theaterRoomApi.getById(Number(id));
      setFormData({
        name: room.name,
        capacity: room.capacity.toString(),
        location: room.location ?? '',
        is_active: room.is_active,
      });
    } catch {
      setError('Failed to load room data');
    } finally {
      setLoadingInitial(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditMode) fetchRoom();
  }, [isEditMode, fetchRoom]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCapacityBlur = () => {
    setFormData((prev) => {
      if (prev.capacity === '') return prev;
      const cleaned = prev.capacity.replace(/^0+/, '') || '0';
      return { ...prev, capacity: cleaned };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const capacityNum = parseInt(formData.capacity, 10);
    if (!Number.isFinite(capacityNum) || capacityNum <= 0) {
      setError('Capacity must be a positive number greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        name: formData.name,
        capacity: capacityNum,
        location: formData.location.trim() || undefined,
        is_active: formData.is_active,
      };

      if (isEditMode) {
        await theaterRoomApi.update(Number(id), payload);
      } else {
        await theaterRoomApi.create(payload);
      }

      navigate('/rooms');
    } catch {
      setError('Failed to save room');
    } finally {
      setLoading(false);
    }
  };

  if (loadingInitial && isEditMode) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 text-sm">Loading room...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="py-8 px-4">
      <section className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isEditMode ? 'Edit Room' : 'Add New Room'}
            </h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-[0.15em]">
              {isEditMode ? 'Update existing theater room' : 'Create a new theater room'}
            </p>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-6" />

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-[0.15em]">
                Room Name
              </label>
              <input
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Room 1, VIP Hall"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-[0.15em]">
                Capacity (seats)
              </label>
              <input
                name="capacity"
                type="number"
                min={1}
                required
                value={formData.capacity}
                onChange={handleChange}
                onBlur={handleCapacityBlur}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-[0.15em]">
                Location (optional)
              </label>
              <input
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Second floor, left wing"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                name="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                htmlFor="is_active"
                className="text-sm text-slate-700 select-none"
              >
                Room is active
              </label>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center items-center w-full rounded-xl bg-indigo-600 text-white text-sm font-semibold px-4 py-2 shadow-sm hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/rooms')}
                className="inline-flex justify-center items-center w-full rounded-xl border border-slate-300 text-sm font-semibold px-4 py-2 text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
};

export default RoomForm;
