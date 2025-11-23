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
    // fetchMovies() se disparará solo por el useEffect (ambos vuelven a '')
    fetchMovies();
  };

  // 🔄 botón Refresh: recarga la tabla con filtros actuales
  const handleRefresh = () => {
    const filters: { title?: string; genre?: string } = {};
    if (titleFilter.trim()) filters.title = titleFilter.trim();
    if (genreFilter) filters.genre = genreFilter;
    fetchMovies(filters);
  };

  return (
    <main className="min-h-screen bg-[#1E1E1E] py-10 px-4">
      <section className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Movies</h1>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-[0.15em]">
              Admin management
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            {/* 🔄 Refresh */}
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center rounded-xl border border-gray-500 text-sm font-semibold px-4 py-2 text-gray-200 hover:bg-gray-700/60 transition"
            >
              ⟳ Refresh
            </button>

            <RouterLink
              to="/movies/new"
              className="inline-flex items-center justify-center rounded-xl bg-[#FFDA63] text-[#1E1E1E] text-sm font-semibold px-4 py-2 shadow hover:opacity-90 transition"
            >
              <span className="mr-1 text-lg">＋</span>
              <span>Add Movie</span>
            </RouterLink>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#2C2C2C] border border-[#D90429] rounded-2xl p-5 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Filter Movies</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.5fr)]">
            {/* Title filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 uppercase tracking-[0.15em]">
                Title
              </label>
              <input
                type="text"
                value={titleFilter}
                onChange={(e) => setTitleFilter(e.target.value)}
                placeholder="Search by title..."
                className="w-full bg-[#1E1E1E] border border-gray-600 rounded-xl px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FFDA63] focus:border-transparent"
              />
            </div>

            {/* Genre filter (select) */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 uppercase tracking-[0.15em]">
                Genre
              </label>
              <select
                value={genreFilter}
                onChange={(e) => setGenreFilter(e.target.value)}
                className="w-full bg-[#1E1E1E] border border-gray-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FFDA63] focus:border-transparent"
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
                className="w-full inline-flex items-center justify-center rounded-xl bg-[#FFDA63] text-[#1E1E1E] text-sm font-semibold px-3 py-2 hover:opacity-90 transition"
              >
                Filter
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="w-full inline-flex items-center justify-center rounded-xl border border-gray-500 text-sm font-semibold px-3 py-2 text-gray-200 hover:bg-gray-700/60 transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#2C2C2C] rounded-2xl border border-gray-700 shadow-lg overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#111111]">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-200 border-b border-gray-700">
                  ID
                </th>
                <th className="px-4 py-3 font-semibold text-gray-200 border-b border-gray-700">
                  Title
                </th>
                <th className="px-4 py-3 font-semibold text-gray-200 border-b border-gray-700">
                  Genre
                </th>
                <th className="px-4 py-3 font-semibold text-gray-200 border-b border-gray-700">
                  Duration (min)
                </th>
                <th className="px-4 py-3 font-semibold text-gray-200 border-b border-gray-700 text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-gray-300"
                  >
                    Loading...
                  </td>
                </tr>
              ) : movies.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-gray-400"
                  >
                    No movies found
                  </td>
                </tr>
              ) : (
                movies.map((movie) => (
                  <tr
                    key={movie.id}
                    className="hover:bg-black/20 transition-colors"
                  >
                    <td className="px-4 py-3 border-b border-gray-700 text-gray-200">
                      {movie.id}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-700 text-white">
                      {movie.title}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-700 text-gray-200">
                      {movie.genre}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-700 text-gray-200">
                      {movie.duration}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-700 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <RouterLink
                          to={`/movies/edit/${movie.id}`}
                          className="inline-flex items-center justify-center rounded-lg bg-[#FFDA63] text-[#1E1E1E] text-xs font-semibold px-3 py-1.5 hover:opacity-90 transition"
                        >
                          ✏️ Edit
                        </RouterLink>
                        <button
                          type="button"
                          onClick={() => handleDelete(movie.id)}
                          className="inline-flex items-center justify-center rounded-lg bg-[#D90429] text-white text-xs font-semibold px-3 py-1.5 hover:bg-red-700 transition"
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
