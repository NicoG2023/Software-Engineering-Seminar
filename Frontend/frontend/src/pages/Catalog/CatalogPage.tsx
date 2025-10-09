import { useEffect, useState } from 'react';
import { CinemaApi } from '../../api/cinemaApi';
import type { Movie } from '../../types/domain';

export default function CatalogPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  useEffect(() => { CinemaApi.listMovies().then(setMovies).catch(() => setMovies([])); }, []);
  return (
    <section>
      <h2>Now Showing</h2>
      <ul>{movies.map(m => <li key={m.id}>{m.title} · {m.genre} · {m.duration}m</li>)}</ul>
    </section>
  );
}
