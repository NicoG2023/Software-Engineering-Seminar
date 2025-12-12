import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { moviesApi, type Movie } from '../../api/moviesApi';
import { screeningsApi, type Screening } from '../../api/screeningsApi';
import { useAuthStrict } from '../../auth/AuthContext';

export default function CatalogPage() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [screenings, setScreenings] = useState<Record<number, Screening[]>>({});
  const [loading, setLoading] = useState(false);

  const { authenticated, hasRole } = useAuthStrict();
  const isAdmin = authenticated && hasRole('ADMIN');

  const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('calendar');

  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  useEffect(() => {
    setLoading(true);
    moviesApi
      .getAll()
      .then(async movieList => {
        setMovies(movieList);

        const map: Record<number, Screening[]> = {};
        await Promise.all(
          movieList.map(async m => {
            try {
              const s = await screeningsApi.getByMovie(m.id);
              map[m.id] = s;
            } catch {
              map[m.id] = [] as Screening[];
            }
          }),
        );
        setScreenings(map);
      })
      .catch(err => {
        console.error('Error loading movies', err);
      })
      .finally(() => setLoading(false));
  }, []);

  function daysInMonth(year: number, month: number): Date[] {
    const start = new Date(year, month, 1);
    const result: Date[] = [];
    const m = start.getMonth();
    while (start.getMonth() === m) {
      result.push(new Date(start));
      start.setDate(start.getDate() + 1);
    }
    return result;
  }

  const monthLabel = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1);
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }, [currentMonth, currentYear]);

  const eventsByDate = useMemo(() => {
    const map: Record<
      string,
      { time: string; room: string; movieTitle: string }[]
    > = {};

    movies.forEach(movie => {
      (screenings[movie.id] ?? []).forEach(s => {
        const d = new Date(s.date);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          const key = s.date;
          if (!map[key]) map[key] = [];
          map[key].push({
            time: s.time,
            room: s.room ?? '',
            movieTitle: movie.title,
          });
        }
      });
    });

    return map;
  }, [movies, screenings, currentMonth, currentYear]);

  const monthDays = useMemo(
    () => daysInMonth(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  return (
    <main className="min-h-screen bg-[#EEF1F5] py-12 px-6">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-gray-800">
          {viewMode === 'calendar' ? 'Movie Calendar' : 'Now Showing'}
        </h1>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              viewMode === 'cards'
                ? 'bg-[#6366F1] text-white shadow-md'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Now Showing
          </button>

          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              viewMode === 'calendar'
                ? 'bg-[#6366F1] text-white shadow-md'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Calendar
          </button>

          <button
            onClick={() => {
              const prev = new Date(currentYear, currentMonth - 1, 1);
              setCurrentMonth(prev.getMonth());
              setCurrentYear(prev.getFullYear());
            }}
            className="px-4 py-2 rounded-xl border bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Prev
          </button>

          <button
            onClick={() => {
              setCurrentMonth(today.getMonth());
              setCurrentYear(today.getFullYear());
            }}
            className="px-4 py-2 rounded-xl border bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Today
          </button>

          <button
            onClick={() => {
              const next = new Date(currentYear, currentMonth + 1, 1);
              setCurrentMonth(next.getMonth());
              setCurrentYear(next.getFullYear());
            }}
            className="px-4 py-2 rounded-xl border bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Next
          </button>

          {/* Botón para admins autenticados -> va a ScreeningForm */}
          {isAdmin && (
            <button
              onClick={() => navigate('/screenings/new')}
              className="px-4 py-2 rounded-xl bg-[#6366F1] text-white text-sm font-semibold shadow hover:bg-[#4F46E5]"
            >
              Register Screening
            </button>
          )}

          {/* Botón de login solo si NO está autenticado */}
          {!authenticated && (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-xl bg-[#6366F1] text-white shadow text-sm font-semibold hover:bg-[#4F46E5]"
            >
              Login
            </button>
          )}
        </div>
      </div>

      {/* ───────────────────── CALENDAR VIEW ───────────────────── */}
      {viewMode === 'calendar' ? (
        <>
          <p className="text-gray-600 font-medium mb-4 text-lg">{monthLabel}</p>

          {loading ? (
            <p className="text-gray-500">Loading…</p>
          ) : (
            <div className="grid grid-cols-7 gap-4">
              {/* Weekday Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div
                  key={d}
                  className="text-center text-sm font-semibold text-gray-600"
                >
                  {d}
                </div>
              ))}

              {/* Calendar Cells */}
              {(() => {
                const firstDay = new Date(
                  currentYear,
                  currentMonth,
                  1,
                ).getDay();
                const blanks = Array.from({ length: firstDay });
                const cells: ReactNode[] = [];

                // empty first cells
                blanks.forEach((_, i) =>
                  cells.push(
                    <div key={`blank-${i}`} className="min-h-[110px]" />,
                  ),
                );

                // real days
                monthDays.forEach(dateObj => {
                  const dateStr = dateObj.toISOString().slice(0, 10);
                  const events = eventsByDate[dateStr] ?? [];

                  cells.push(
                    <div
                      key={dateStr}
                      className="bg-white rounded-xl shadow-sm p-3 border border-gray-200 hover:shadow-md transition"
                    >
                      <div className="text-gray-800 font-semibold text-sm">
                        {dateObj.getDate()}
                      </div>

                      <div className="mt-2 space-y-1">
                        {events.length === 0 ? (
                          <p className="text-xs text-gray-400">
                            No screenings
                          </p>
                        ) : (
                          events.slice(0, 4).map((ev, idx) => (
                            <div
                              key={`${dateStr}-${idx}`}
                              className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-lg"
                            >
                              {ev.time} · {ev.movieTitle} ({ev.room})
                            </div>
                          ))
                        )}
                      </div>
                    </div>,
                  );
                });

                return cells;
              })()}
            </div>
          )}
        </>
      ) : (
        /* ───────────────────────── MOVIE CARDS VIEW ───────────────────────── */
        (movies.length === 0 ? (
          <p className="text-center text-gray-500 text-lg">
            No movies available right now.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
            {movies.map(m => (
              <div
                key={m.id}
                className="bg-white rounded-2xl shadow-md border border-gray-200 hover:shadow-xl transition p-6"
              >
                <h2 className="text-xl font-semibold text-gray-800">
                  {m.title}
                </h2>
                <p className="text-[#6366F1] text-sm mb-2 uppercase tracking-wide">
                  {m.genre}
                </p>

                <p className="text-gray-500 text-sm mb-3">
                  ⏱ <b>{m.duration}</b> min
                </p>

                <div className="space-y-1 mb-4">
                  {(screenings[m.id] ?? [])
                    .slice(0, 3)
                    .map((s, idx) => (
                      <div
                        key={idx}
                        className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-lg"
                      >
                        {s.date} · {s.time} · {s.room ?? ''}
                      </div>
                    ))}
                </div>

                <div className="flex justify-between items-center">
                  <Link
                    to={`/movies/${m.id}`}
                    className="px-4 py-2 rounded-xl bg-[#6366F1] text-white font-semibold text-sm hover:bg-[#4F46E5] transition"
                  >
                    View Details
                  </Link>

                  <span className="text-gray-400 text-xs">
                    ⭐ {Math.floor(Math.random() * 2) + 4}.0
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </main>
  );
}
