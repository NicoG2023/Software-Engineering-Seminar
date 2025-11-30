// src/pages/Catalog/CatalogPage.tsx
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { moviesApi, type Movie } from '../../api/moviesApi';
import { screeningsApi, type Screening } from '../../api/screeningsApi';
import { roomsApi, type Room } from '../../api/roomsApi';
import { useAuthStrict } from '../../auth/AuthContext';

export default function CatalogPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [screenings, setScreenings] = useState<Record<number, Screening[]>>({});
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const { authenticated, login } = useAuthStrict();

  const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('calendar');

  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const [registerOpen, setRegisterOpen] = useState(false);
  const [regMovieId, setRegMovieId] = useState<number | ''>('');
  const [regRoomId, setRegRoomId] = useState<number | ''>('');
  const [regDate, setRegDate] = useState('');
  const [regTime, setRegTime] = useState('19:00');
  const timeSlots = ['10:00', '13:00', '16:00', '19:00', '21:00'];

  useEffect(() => {
    setLoading(true);
    Promise.all([moviesApi.getAll(), roomsApi.list()])
      .then(async ([movieList, roomList]) => {
        setMovies(movieList);
        setRooms(roomList);
        const map: Record<number, Screening[]> = {};
        await Promise.all(
          movieList.map(async (m) => {
            try {
              const s = await screeningsApi.getByMovie(m.id);
              map[m.id] = s;
            } catch {
              map[m.id] = [] as Screening[];
            }
          })
        );
        setScreenings(map);
      })
      .catch((err) => {
        console.error('Error loading movies', err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const firstMovieId = movies[0]?.id;
    const firstRoomId = rooms[0]?.id;
    const d = new Date();
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!regMovieId && firstMovieId) setRegMovieId(firstMovieId);
    if (!regRoomId && firstRoomId) setRegRoomId(firstRoomId);
    if (!regDate) setRegDate(iso);
  }, [movies, rooms]);

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
    const map: Record<string, { time: string; room: string; movieTitle: string }[]> = {};
    movies.forEach((movie) => {
      (screenings[movie.id] ?? []).forEach((s) => {
        const d = new Date(s.date);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          const key = s.date;
          if (!map[key]) map[key] = [];
          map[key].push({ time: s.time, room: s.room ?? '', movieTitle: movie.title });
        }
      });
    });
    return map;
  }, [movies, screenings, currentMonth, currentYear]);

  const monthDays = useMemo(() => daysInMonth(currentYear, currentMonth), [currentYear, currentMonth]);

  return (
    <main className="min-h-screen bg-[#1E1E1E] py-12 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: '#FFDA63' }}>
          {viewMode === 'calendar' ? 'Movie Calendar' : 'Now Showing'}
        </h1>
        <div className="flex gap-2">
          <button className={`px-3 py-2 rounded-xl border ${viewMode === 'cards' ? 'bg-[#FFDA63] text-[#1E1E1E]' : 'text-white border-[#FFDA63]'}`} onClick={() => setViewMode('cards')}>Now Showing</button>
          <button className={`px-3 py-2 rounded-xl border ${viewMode === 'calendar' ? 'bg-[#FFDA63] text-[#1E1E1E]' : 'text-white border-[#FFDA63]'}`} onClick={() => setViewMode('calendar')}>Calendar</button>
          <button className="px-3 py-2 rounded-xl border text-white border-[#FFDA63]" onClick={() => {
            const prev = new Date(currentYear, currentMonth - 1, 1);
            setCurrentMonth(prev.getMonth());
            setCurrentYear(prev.getFullYear());
          }}>Prev Month</button>
          <button className="px-3 py-2 rounded-xl border text-white border-[#FFDA63]" onClick={() => {
            setCurrentMonth(today.getMonth());
            setCurrentYear(today.getFullYear());
          }}>Today</button>
          <button className="px-3 py-2 rounded-xl border text-white border-[#FFDA63]" onClick={() => {
            const next = new Date(currentYear, currentMonth + 1, 1);
            setCurrentMonth(next.getMonth());
            setCurrentYear(next.getFullYear());
          }}>Next Month</button>
          {authenticated ? (
            <button className="px-3 py-2 rounded-xl bg-[#FFDA63] text-[#1E1E1E]" onClick={() => setRegisterOpen(true)}>Register Screening</button>
          ) : (
            <button className="px-3 py-2 rounded-xl bg-[#FFDA63] text-[#1E1E1E]" onClick={login}>Login</button>
          )}
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <>
          <p className="text-white mb-4">{monthLabel}</p>
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                <div key={d} className="text-center text-white mb-2">{d}</div>
              ))}
              {(() => {
                const firstDay = new Date(currentYear, currentMonth, 1).getDay();
                const blanks = Array.from({ length: firstDay });
                const cells: ReactNode[] = [];
                blanks.forEach((_, i) => {
                  cells.push(<div key={`blank-${i}`} className="min-h-[100px] rounded-md bg-[#2C2C2C]" />);
                });
                monthDays.forEach((dateObj) => {
                  const dateStr = dateObj.toISOString().slice(0,10);
                  const events = eventsByDate[dateStr] ?? [];
                  cells.push(
                    <div key={dateStr} className="min-h-[140px] rounded-md bg-white p-2">
                      <div className="text-sm font-semibold text-black">{dateObj.getDate()}</div>
                      <hr className="my-1" />
                      {events.length === 0 ? (
                        <div className="text-xs text-black">No screenings</div>
                      ) : (
                        events.slice(0,5).map((ev, idx) => (
                          <div key={`${dateStr}-${idx}`} className="text-xs text-black">{ev.time} · {ev.movieTitle} · {ev.room}</div>
                        ))
                      )}
                    </div>
                  );
                });
                return cells;
              })()}
            </div>
          )}
        </>
      ) : (
        <>
          {movies.length === 0 ? (
            <p className="text-center text-gray-400 text-lg">No movies available right now.</p>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
              {movies.map((m) => (
                <div key={m.id} className="bg-[#2C2C2C] border-2 border-[#D90429] rounded-2xl shadow-md hover:shadow-xl hover:border-[#FFDA63] transition-all duration-300 p-6">
                  <h2 className="text-xl font-semibold text-white mb-1">{m.title}</h2>
                  <p className="text-[#FFDA63] text-sm mb-3 uppercase">{m.genre}</p>
                  <p className="text-gray-300 text-sm mb-3">⏱ <span className="font-medium">{m.duration}</span> min</p>
                  <div className="space-y-1 mb-3">
                    {(screenings[m.id] ?? []).slice(0,3).map((s) => (
                      <div key={`${m.id}-${s.date}-${s.time}`} className="text-sm text-gray-200">{s.date} · {s.time} · {s.room ?? ''}</div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center">
                    <Link to={`/movies/${m.id}`} className="bg-[#FFDA63] text-[#1E1E1E] text-sm px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition duration-200">View Details</Link>
                    <span className="text-gray-400 text-xs">⭐ {Math.floor(Math.random() * 2) + 4}.0</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {registerOpen && (
        <div className="max-w-7xl mx-auto mt-6 bg-[#2C2C2C] p-4 rounded-xl">
          <h2 className="text-white text-lg font-semibold mb-3">Register Screening</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select className="rounded-md p-2" value={regMovieId} onChange={(e) => setRegMovieId(Number(e.target.value))}>
              {movies.map(m => (<option key={m.id} value={m.id}>{m.title}</option>))}
            </select>
            <select className="rounded-md p-2" value={regRoomId} onChange={(e) => setRegRoomId(Number(e.target.value))}>
              {rooms.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
            </select>
            <input className="rounded-md p-2" type="date" value={regDate} onChange={(e) => setRegDate(e.target.value)} />
            <select className="rounded-md p-2" value={regTime} onChange={(e) => setRegTime(e.target.value)}>
              {timeSlots.map(t => (<option key={t} value={t}>{t}</option>))}
            </select>
          </div>
          <div className="mt-3 flex gap-2">
            <button className="bg-[#FFDA63] text-[#1E1E1E] px-4 py-2 rounded-xl font-semibold" onClick={async () => {
              if (!regMovieId || !regRoomId || !regDate || !regTime) return;
              try {
                await screeningsApi.create({ movie_id: Number(regMovieId), room_id: Number(regRoomId), date: regDate, time: regTime });
                const map: Record<number, Screening[]> = {};
                await Promise.all(
                  movies.map(async (m) => {
                    try {
                      const s = await screeningsApi.getByMovie(m.id);
                      map[m.id] = s;
                    } catch {
                      map[m.id] = [] as Screening[];
                    }
                  })
                );
                setScreenings(map);
                setRegisterOpen(false);
              } catch (e) {
                console.error(e);
              }
            }}>Save</button>
            <button className="border border-[#FFDA63] text-white px-4 py-2 rounded-xl" onClick={() => setRegisterOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </main>
  );
}
