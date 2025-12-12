// src/pages/movies/MovieForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { moviesApi, type Genre } from '../../../api/moviesApi';

type MovieFormState = {
  title: string;
  genre: string;
  duration: string; // string en el form, número al enviar
};

const MovieForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [genres, setGenres] = useState<Genre[]>([]);
  const [formData, setFormData] = useState<MovieFormState>({
    title: '',
    genre: '',
    duration: '',
  });

  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar géneros
  useEffect(() => {
    (async () => {
      try {
        const data = await moviesApi.getGenres();
        setGenres(data);
      } catch (e) {
        console.error('Error loading genres', e);
      }
    })();
  }, []);

  // Cargar película en modo edición
  const fetchMovie = useCallback(async () => {
    if (!id) return;
    try {
      setLoadingInitial(true);
      const movie = await moviesApi.getById(Number(id));
      setFormData({
        title: movie.title,
        genre: movie.genre,
        duration: movie.duration.toString(),
      });
    } catch {
      setError('Failed to load movie data');
    } finally {
      setLoadingInitial(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditMode) fetchMovie();
  }, [isEditMode, fetchMovie]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDurationBlur = () => {
    setFormData((prev) => {
      if (prev.duration === '') return prev;
      const cleaned = prev.duration.replace(/^0+/, '') || '0';
      return { ...prev, duration: cleaned };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const durationNum = parseInt(formData.duration, 10);
    if (!Number.isFinite(durationNum) || durationNum <= 0) {
      setError('Duration must be a positive number greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = {
        title: formData.title,
        genre: formData.genre,
        duration: durationNum,
      };

      if (isEditMode) {
        await moviesApi.update(Number(id), payload);
      } else {
        await moviesApi.create(payload);
      }

      navigate('/movies');
    } catch {
      setError('Failed to save movie');
    } finally {
      setLoading(false);
    }
  };

  if (loadingInitial && isEditMode) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 text-sm">Loading movie...</p>
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
              {isEditMode ? 'Edit Movie' : 'Add New Movie'}
            </h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-[0.15em]">
              {isEditMode ? 'Update existing movie' : 'Create a new movie'}
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
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-[0.15em]">
                Movie Title
              </label>
              <input
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Inception"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Genre (select) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-[0.15em]">
                Genre
              </label>
              <select
                name="genre"
                required
                value={formData.genre}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="" disabled>
                  Select a genre...
                </option>
                {genres.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-[0.15em]">
                Duration (minutes)
              </label>
              <input
                name="duration"
                type="number"
                min={1}
                required
                value={formData.duration}
                onChange={handleChange}
                onBlur={handleDurationBlur}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
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
                onClick={() => navigate('/movies')}
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

export default MovieForm;
