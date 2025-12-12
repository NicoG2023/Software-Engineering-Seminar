// src/pages/movies/MovieList.tsx
import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { moviesApi } from '../../../api/moviesApi';
import type { Movie, Genre } from '../../../api/moviesApi';

const MovieList: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [titleFilter, setTitleFilter] = useState<string>('');
  const [genreFilter, setGenreFilter] = useState<string>('');

  // --- cargar películas (helper) ---
  const fetchMovies = async (filters?: { title?: string; genre?: string }) => {
    try {
      setLoading(true);
      const data = await moviesApi.getAll(filters);
      setMovies(data);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- carga inicial de películas y géneros ---
  useEffect(() => {
    fetchMovies();
    (async () => {
      try {
        const data = await moviesApi.getGenres();
        setGenres(data);
      } catch (e) {
        console.error('Error loading genres', e);
      }
    })();
  }, []);

  // --- auto-aplicar filtros (debounce 300ms) ---
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const filters: { title?: string; genre?: string } = {};
      if (titleFilter.trim()) filters.title = titleFilter.trim();
      if (genreFilter) filters.genre = genreFilter;
      fetchMovies(filters);
    }, 300);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleFilter, genreFilter]);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        await moviesApi.delete(id);
        // recargar con filtros vigentes
        const filters: { title?: string; genre?: string } = {};
        if (titleFilter.trim()) filters.title = titleFilter.trim();
        if (genreFilter) filters.genre = genreFilter;
        fetchMovies(filters);
      } catch (error) {
        console.error('Error deleting movie:', error);
      }
    }
  };

  // botón Filter ahora fuerza el refetch inmediato con filtros actuales
  const handleFilter = () => {
    const filters: { title?: string; genre?: string } = {};
    if (titleFilter.trim()) filters.title = titleFilter.trim();
    if (genreFilter) filters.genre = genreFilter;
    fetchMovies(filters);
  };

  const handleClearFilters = () => {
    setTitleFilter('');
    setGenreFilter('');
    fetchMovies();
  };

  const handleRefresh = () => {
    const filters: { title?: string; genre?: string } = {};
    if (titleFilter.trim()) filters.title = titleFilter.trim();
    if (genreFilter) filters.genre = genreFilter;
    fetchMovies(filters);
  };

  return (
    <main className="py-8 px-4">
      <section className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Movies</h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-[0.15em]">
              Admin management
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            {/* Ir al catálogo */}
            <RouterLink
              to="/catalog"
              className="inline-flex items-center justify-center rounded-xl border border-indigo-600 text-sm font-semibold px-4 py-2 text-indigo-700 bg-white hover:bg-indigo-50 transition"
            >
              🎬 View Catalog
            </RouterLink>

            {/* Refresh */}
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 text-sm font-semibold px-4 py-2 text-slate-700 hover:bg-slate-100 transition"
            >
              ⟳ Refresh
            </button>

            <RouterLink
              to="/movies/new"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 text-white text-sm font-semibold px-4 py-2 shadow-md hover:bg-indigo-700 transition"
            >
              <span className="mr-1 text-lg">＋</span>
              <span>Add Movie</span>
            </RouterLink>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-xl">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Filter Movies</h2>

          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.5fr)]">
            {/* Title filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-[0.15em]">
                Title
              </label>
              <input
                type="text"
                value={titleFilter}
                onChange={(e) => setTitleFilter(e.target.value)}
                placeholder="Search by title..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Genre filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-[0.15em]">
                Genre
              </label>
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All genres</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
              <button
                type="button"
                onClick={handleFilter}
                className="w-full inline-flex items-center justify-center rounded-xl bg-indigo-600 text-white text-sm font-semibold px-3 py-2 hover:bg-indigo-700 transition"
              >
                Filter
              </button>

              <button
                type="button"
                onClick={handleClearFilters}
                className="w-full inline-flex items-center justify-center rounded-xl border border-slate-300 text-sm font-semibold px-3 py-2 text-slate-700 hover:bg-slate-100 transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-700">ID</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Title</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Genre</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Duration (min)</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              ) : movies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No movies found
                  </td>
                </tr>
              ) : (
                movies.map((movie) => (
                  <tr
                    key={movie.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 border-b border-slate-200 text-slate-700">
                      {movie.id}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-200 text-slate-900">
                      {movie.title}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-200 text-slate-700">
                      {movie.genre}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-200 text-slate-700">
                      {movie.duration}
                    </td>
                    <td className="px-4 py-3 border-b border-slate-200 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <RouterLink
                          to={`/movies/edit/${movie.id}`}
                          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 shadow hover:bg-indigo-700 transition"
                        >
                          ✏️ Edit
                        </RouterLink>

                        <button
                          type="button"
                          onClick={() => handleDelete(movie.id)}
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

export default MovieList;
