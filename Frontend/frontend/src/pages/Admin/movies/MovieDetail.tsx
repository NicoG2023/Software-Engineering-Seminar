// src/pages/Movies/MovieDetail.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { moviesApi, type Movie } from '../../../api/moviesApi';
import { screeningsApi, type Screening } from '../../../api/screeningsApi';

const MovieDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [screenings, setScreenings] = useState<Screening[]>([]);

  const [loadingMovie, setLoadingMovie] = useState(true);
  const [loadingScreenings, setLoadingScreenings] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [screeningsError, setScreeningsError] = useState<string | null>(null);

  const movieId = id ? Number(id) : NaN;

  const fetchMovie = useCallback(async () => {
    if (!id || Number.isNaN(movieId)) {
      setError('Invalid movie id');
      setLoadingMovie(false);
      return;
    }

    try {
      setLoadingMovie(true);
      setError(null);
      const data = await moviesApi.getById(movieId);
      setMovie(data);
    } catch {
      setError('Failed to load movie data');
      setMovie(null);
    } finally {
      setLoadingMovie(false);
    }
  }, [id, movieId]);

  const fetchScreenings = useCallback(async () => {
    if (!id || Number.isNaN(movieId)) {
      setScreeningsError('Invalid movie id');
      setLoadingScreenings(false);
      return;
    }

    try {
      setLoadingScreenings(true);
      setScreeningsError(null);
      const data = await screeningsApi.getByMovie(movieId);
      const sorted = [...data].sort((a, b) => {
        const aKey = `${a.date} ${a.time}`;
        const bKey = `${b.date} ${b.time}`;
        return aKey.localeCompare(bKey);
      });
      setScreenings(sorted);
    } catch {
      setScreeningsError('Failed to load screenings');
      setScreenings([]);
    } finally {
      setLoadingScreenings(false);
    }
  }, [id, movieId]);

  useEffect(() => {
    fetchMovie();
    fetchScreenings();
  }, [fetchMovie, fetchScreenings]);

  const formatPrice = (price?: number | null) => {
    if (price == null) return 'To be confirmed';
    return price.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    });
  };

  // Loading principal (película)
  if (loadingMovie) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading movie details...</p>
        </div>
      </main>
    );
  }

  // Error o no encontrada
  if (error || !movie) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-rose-200 rounded-2xl p-6 shadow-xl text-center">
          <h1 className="text-xl font-semibold text-rose-600 mb-2">
            {error || 'Movie not found'}
          </h1>
          <p className="text-slate-600 text-sm mb-4">
            We couldn&apos;t find the movie you were looking for.
          </p>
          <RouterLink
            to="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-100"
          >
            ← Back to Catalog
          </RouterLink>
        </div>
      </main>
    );
  }

  // Vista normal
  return (
    <main className="py-8 px-4">
      <section className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8">
        {/* Top bar: back */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <RouterLink
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition"
          >
            <span className="text-lg">←</span>
            <span>Back to Catalog</span>
          </RouterLink>
        </div>

        {/* Title */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1 text-slate-900">
            {movie.title}
          </h1>
          <p className="text-xs text-slate-400 uppercase tracking-[0.15em]">
            Movie details
          </p>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-6" />

        {/* Basic info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-sm text-slate-500 mb-1">Genre</p>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 uppercase tracking-wide">
              {movie.genre}
            </span>
          </div>

          <div>
            <p className="text-sm text-slate-500 mb-1">Duration</p>
            <p className="text-base text-slate-800 font-medium">
              {movie.duration} minutes
            </p>
          </div>
        </div>

        {/* Screenings section */}
        <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-5">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-slate-900">
            <span className="text-amber-400">📅</span>
            <span>Screenings</span>
          </h2>

          {loadingScreenings ? (
            <p className="text-sm text-slate-600">Loading screenings...</p>
          ) : screeningsError ? (
            <p className="text-sm text-rose-600">{screeningsError}</p>
          ) : screenings.length === 0 ? (
            <p className="text-sm text-slate-600">
              No screenings available for this movie yet.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {screenings.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {s.room || `Room #${s.room_id}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {s.date} · {s.time}
                    </p>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-1">
                    <span className="text-sm font-semibold text-indigo-700">
                      {formatPrice(s.price ?? null)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {s.available_seats} seats available
                    </span>
                    {/* Futuro botón "Buy tickets" */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default MovieDetail;
