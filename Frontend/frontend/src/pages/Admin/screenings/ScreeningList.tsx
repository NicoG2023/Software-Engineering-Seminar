// src/pages/Admin/screenings/ScreeningList.tsx
import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { screeningsApi, type Screening } from '../../../api/screeningsApi';
import { moviesApi, type Movie } from '../../../api/moviesApi';
import { theaterRoomApi, type TheaterRoom } from '../../../api/theaterRoomApi';

type ScreeningRow = Screening & {
  movie_title?: string;
  room_name?: string;
};

const ScreeningList: React.FC = () => {
  const [screenings, setScreenings] = useState<ScreeningRow[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [rooms, setRooms] = useState<TheaterRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [movieFilter, setMovieFilter] = useState<string>('');
  const [roomFilter, setRoomFilter] = useState<string>('');

  const fetchScreenings = async () => {
    try {
      setLoading(true);
      const data = await screeningsApi.getAll();
      setScreenings(data as ScreeningRow[]);
    } catch (error) {
      console.error('Error fetching screenings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cargar screenings
    fetchScreenings();

    // Cargar movies y rooms en paralelo
    (async () => {
      try {
        const [moviesData, roomsData] = await Promise.all([
          moviesApi.getAll(),
          theaterRoomApi.getAll(),
        ]);
        setMovies(moviesData);
        setRooms(roomsData);
      } catch (error) {
        console.error('Error loading movies or rooms:', error);
      }
    })();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this screening?')) return;

    try {
      await screeningsApi.delete(id);
      await fetchScreenings();
    } catch (error) {
      console.error('Error deleting screening:', error);
    }
  };

  const handleRefresh = () => {
    fetchScreenings();
  };

  const handleClearFilters = () => {
    setMovieFilter('');
    setRoomFilter('');
  };

  // Aplicar filtros en el front (para no complicar el backend)
  const filteredScreenings = screenings.filter((s) => {
    if (movieFilter && String(s.movie_id) !== movieFilter) return false;
    if (roomFilter && String(s.room_id) !== roomFilter) return false;
    return true;
  });

  const formatPrice = (price?: number | null) => {
    if (price == null) return '—';
    return `$${price.toFixed(2)}`;
  };

  return (
    <main className="min-h-screen bg-[#1E1E1E] py-10 px-4">
      <section className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Screenings</h1>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-[0.15em]">
              Admin management
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center justify-center rounded-xl border border-gray-500 text-sm font-semibold px-4 py-2 text-gray-200 hover:bg-gray-700/60 transition"
            >
              ⟳ Refresh
            </button>

            <RouterLink
              to="/screenings/new"
              className="inline-flex items-center justify-center rounded-xl bg-[#FFDA63] text-[#1E1E1E] text-sm font-semibold px-4 py-2 shadow hover:opacity-90 transition"
            >
              <span className="mr-1 text-lg">＋</span>
              <span>Add Screening</span>
            </RouterLink>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-[#2C2C2C] border border-[#D90429] rounded-2xl p-5 mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Filter Screenings</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,2fr)]">
            {/* Movie filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 uppercase tracking-[0.15em]">
                Movie
              </label>
              <select
                value={movieFilter}
                onChange={(e) => setMovieFilter(e.target.value)}
                className="w-full bg-[#1E1E1E] border border-gray-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FFDA63] focus:border-transparent"
              >
                <option value="">All movies</option>
                {movies.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Room filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 uppercase tracking-[0.15em]">
                Room
              </label>
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="w-full bg-[#1E1E1E] border border-gray-600 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FFDA63] focus:border-transparent"
              >
                <option value="">All rooms</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botón Clear Filters */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center justify-center rounded-xl border border-gray-500 text-sm font-semibold px-4 py-2 text-gray-200 hover:bg-gray-700/60 transition"
            >
              ✧ Clear Filters
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-[#2C2C2C] rounded-2xl border border-gray-700 shadow-lg overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#111111]">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-200 border-b border-gray-700">
                  ID
                </th>
                <th className="px-4 py-3 font-semibold text-gray-200 border-b border-gray-700">
                  Movie
                </th>
                <th className="px-4 py-3 font-semibold text-gray-200 border-b border-gray-700">
                  Room
                </th>
                <th className="px-4 py-3 font-semibold text-gray-200 border-b border-gray-700">
                  Date
                </th>
                <th className="px-4 py-3 font-semibold text-gray-200 border-b border-gray-700">
                  Time
                </th>
                <th className="px-4 py-3 font-semibold text-gray-200 border-b border-gray-700">
                  Price
                </th>
                <th className="px-4 py-3 font-semibold text-gray-200 border-b border-gray-700">
                  Available seats
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
                    colSpan={8}
                    className="px-4 py-6 text-center text-gray-300"
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredScreenings.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-gray-400"
                  >
                    No screenings found
                  </td>
                </tr>
              ) : (
                filteredScreenings.map((s) => {
                  const movieName =
                    s.movie_title ||
                    movies.find((m) => m.id === s.movie_id)?.title ||
                    `Movie #${s.movie_id}`;
                  const roomName =
                    s.room_name ||
                    rooms.find((r) => r.id === s.room_id)?.name ||
                    `Room #${s.room_id}`;

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-black/20 transition-colors"
                    >
                      <td className="px-4 py-3 border-b border-gray-700 text-gray-200">
                        {s.id}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-700 text-white">
                        {movieName}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-700 text-gray-200">
                        {roomName}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-700 text-gray-200">
                        {s.date}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-700 text-gray-200">
                        {s.time}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-700 text-gray-200">
                        {formatPrice(s.price ?? null)}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-700 text-gray-200">
                        {s.available_seats}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-700 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <RouterLink
                            to={`/screenings/edit/${s.id}`}
                            className="inline-flex items-center justify-center rounded-lg bg-[#FFDA63] text-[#1E1E1E] text-xs font-semibold px-3 py-1.5 hover:opacity-90 transition"
                          >
                            ✏️ Edit
                          </RouterLink>
                          <button
                            type="button"
                            onClick={() => handleDelete(s.id)}
                            className="inline-flex items-center justify-center rounded-lg bg-[#D90429] text-white text-xs font-semibold px-3 py-1.5 hover:bg-red-700 transition"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default ScreeningList;
