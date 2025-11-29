// src/api/moviesApi.ts
import { http } from './http';

export interface Movie {
  id: number;
  title: string;
  genre: string;
  duration: number;
}

export interface CreateMovieDto {
  title: string;
  genre: string;
  duration: number;
}

export interface Genre {
  id: number;
  name: string;
}

const FLASK_API = `${import.meta.env.VITE_FLASK_API_URL as string}/api`;

export const moviesApi = {
  getAll: async (filters?: { genre?: string; title?: string }): Promise<Movie[]> => {
    let url = `${FLASK_API}/movies`;

    if (filters) {
      const params = new URLSearchParams();
      if (filters.genre) params.append('genre', filters.genre);
      if (filters.title) params.append('title', filters.title);
      if (params.toString()) url += `?${params.toString()}`;
    }

    const response = await http.get(url);
    return response.data;
  },

  getById: async (id: number): Promise<Movie> => {
    const response = await http.get(`${FLASK_API}/movies/${id}`);
    return response.data;
  },

  // 👇 nuevo
  getGenres: async (): Promise<Genre[]> => {
    const response = await http.get(`${FLASK_API}/genres`);
    return response.data;
  },

  create: async (movie: CreateMovieDto): Promise<Movie> => {
    const response = await http.post(`${FLASK_API}/movies`, movie);
    return response.data;
  },

  update: async (id: number, movie: Partial<CreateMovieDto>): Promise<void> => {
    await http.put(`${FLASK_API}/movies/${id}`, movie);
  },

  delete: async (id: number): Promise<void> => {
    await http.delete(`${FLASK_API}/movies/${id}`);
  },
};
