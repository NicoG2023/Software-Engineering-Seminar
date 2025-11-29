// src/pages/Admin/screenings/ScreeningForm.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  screeningsApi,
  type CreateScreeningDto,
  type UpdateScreeningDto,
} from '../../../api/screeningsApi';
import { moviesApi, type Movie } from '../../../api/moviesApi';
import { theaterRoomApi, type TheaterRoom } from '../../../api/theaterRoomApi';

type ScreeningFormState = {
  movie_id: string;
  room_id: string;
  date: string;   // "YYYY-MM-DD"
  time: string;   // "HH:MM"
  price: string;  // string en el form, number al enviar
};

const ScreeningForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [movies, setMovies] = useState<Movie[]>([]);
  const [rooms, setRooms] = useState<TheaterRoom[]>([]);

  const [formData, setFormData] = useState<ScreeningFormState>({
    movie_id: '',
    room_id: '',
    date: '',
    time: '',
    price: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoadingInitial(true);
        // Cargar movies y rooms primero
        const [moviesData, roomsData] = await Promise.all([
          moviesApi.getAll(),
          theaterRoomApi.getAll(),
        ]);
        setMovies(moviesData);
        setRooms(roomsData);

        // Si es edición, cargar screening
        if (isEditMode && id) {
          const screening = await screeningsApi.getById(Number(id));
          setFormData({
            movie_id: screening.movie_id.toString(),
            room_id: screening.room_id.toString(),
            date: screening.date,
            time: screening.time,
            price:
              screening.price !== null && screening.price !== undefined
                ? screening.price.toString()
                : '',
          });
        }
      } catch (e) {
        console.error('Error loading initial data', e);
        setError('Failed to load initial data');
      } finally {
        setLoadingInitial(false);
      }
    })();
  }, [id, isEditMode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones mínimas
    if (!formData.movie_id || !formData.room_id || !formData.date || !formData.time) {
      setError('Please fill all required fields');
      return;
    }

    const movieIdNum = Number(formData.movie_id);
    const roomIdNum = Number(formData.room_id);
    if (!Number.isFinite(movieIdNum) || !Number.isFinite(roomIdNum)) {
      setError('Invalid movie or room selection');
      return;
    }

    let priceNumber: number | null = null;
    if (formData.price.trim() !== '') {
      const parsed = Number(formData.price);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setError('Price must be a non-negative number');
        return;
      }
      priceNumber = parsed;
    }

    try {
      setLoading(true);
      setError(null);

      if (isEditMode && id) {
        const payload: UpdateScreeningDto = {
          movie_id: movieIdNum,
          room_id: roomIdNum,
          date: formData.date,
          time: formData.time,
        };
        if (priceNumber !== null) {
          payload.price = priceNumber;
        } else {
          // si quieres limpiar el precio podrías mandar null explícito
          payload.price = null;
        }

        await screeningsApi.update(Number(id), payload);
      } else {
        const payload: CreateScreeningDto = {
          movie_id: movieIdNum,
          room_id: roomIdNum,
          date: formData.date,
          time: formData.time,
        };
        if (priceNumber !== null) {
          payload.price = priceNumber;
        }
        await screeningsApi.create(payload);
      }

      navigate('/screenings');
    } catch (e) {
      console.error('Error saving screening', e);
      setError('Failed to save screening');
    } finally {
      setLoading(false);
    }
  };

  if (loadingInitial) {
    return (
      <main className="min-h-screen bg-[#1E1E1E] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-[#FFDA63] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-300 text-sm">Loading screening data...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#1E1E1E] py-10 px-4">
      <section className="max-w-xl mx-auto">
        <div className="bg-[#2C2C2C] rounded-2xl border border-[#D90429] shadow-lg p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {isEditMode ? 'Edit Screening' : 'Add New Screening'}
            </h1>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-[0.15em]">
              {isEditMode ? 'Update existing screening' : 'Create a new screening'}
            </p>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#FFDA63] to-transparent opacity-70 mb-6" />

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Movie */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 uppercase tracking-[0.15em]">
                Movie
              </label>
              <select
                name="movie_id"
                required
                value={formData.movie_id}
                onChange={handleChange}
                className="w-full bg-[#1E1E1E] border border-gray-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FFDA63] focus:border-transparent"
              >
                <option value="" disabled>
                  Select a movie...
                </option>
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Room */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 uppercase tracking-[0.15em]">
                Room
              </label>
              <select
                name="room_id"
                required
                value={formData.room_id}
                onChange={handleChange}
                className="w-full bg-[#1E1E1E] border border-gray-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FFDA63] focus:border-transparent"
              >
                <option value="" disabled>
                  Select a room...
                </option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (cap. {r.capacity})
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 uppercase tracking-[0.15em]">
                Date
              </label>
              <input
                name="date"
                type="date"
                required
                value={formData.date}
                onChange={handleChange}
                className="w-full bg-[#1E1E1E] border border-gray-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FFDA63] focus:border-transparent"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 uppercase tracking-[0.15em]">
                Time
              </label>
              <input
                name="time"
                type="time"
                required
                value={formData.time}
                onChange={handleChange}
                className="w-full bg-[#1E1E1E] border border-gray-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FFDA63] focus:border-transparent"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 uppercase tracking-[0.15em]">
                Price (optional)
              </label>
              <input
                name="price"
                type="number"
                min={0}
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className="w-full bg-[#1E1E1E] border border-gray-600 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFDA63] focus:border-transparent"
                placeholder="e.g. 25.00"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center items-center w-full rounded-xl bg-[#FFDA63] text-[#1E1E1E] text-sm font-semibold px-4 py-2 hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-[#1E1E1E] border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save'
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/screenings')}
                className="inline-flex justify-center items-center w-full rounded-xl border border-gray-500 text-sm font-semibold px-4 py-2 text-gray-200 hover:bg-gray-700/60 transition"
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

export default ScreeningForm;
