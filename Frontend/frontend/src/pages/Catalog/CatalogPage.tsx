// src/pages/Catalog/CatalogPage.tsx
import { useEffect, useState } from 'react';
import { moviesApi, type Movie } from '../../api/moviesApi';

export default function CatalogPage() {
  const [movies, setMovies] = useState<Movie[]>([]);

  useEffect(() => {
    moviesApi
      .getAll()
      .then((list) => setMovies(list))
      .catch((err) => {
        console.error('Error loading movies', err);
        setMovies([]);
      });
  }, []);

  return (
    <main className="min-h-screen bg-[#1E1E1E] py-12 px-6">
      <h1 className="text-4xl font-bold text-center text-white mb-12 tracking-tight">
        🎬 Now Showing
      </h1>

      {movies.length === 0 ? (
        <p className="text-center text-gray-400 text-lg">No movies available right now.</p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {movies.map((m) => (
            <div
              key={m.id}
              className="bg-[#2C2C2C] border-2 border-[#D90429] rounded-2xl shadow-md hover:shadow-xl hover:border-[#FFDA63] transition-all duration-300 p-6 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-semibold text-white mb-1">{m.title}</h2>
                <p className="text-[#FFDA63] text-sm mb-3 uppercase">{m.genre}</p>
                <p className="text-gray-300 text-sm">
                  ⏱ <span className="font-medium">{m.duration}</span> min
                </p>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <button className="bg-[#FFDA63] text-[#1E1E1E] text-sm px-4 py-2 rounded-xl font-semibold hover:opacity-90 transition duration-200">
                  View Details
                </button>
                <span className="text-gray-400 text-xs">⭐ {Math.floor(Math.random() * 2) + 4}.0</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
