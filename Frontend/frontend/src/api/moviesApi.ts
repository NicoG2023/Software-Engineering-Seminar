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

const API = `/api`;

export const moviesApi = {
  getAll: async (filters?: { genre?: string; title?: string }): Promise<Movie[]> => {
    let url = `${API}/movies`;

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
    const response = await http.get(`${API}/movies/${id}`);
    return response.data;
  },

  getGenres: async (): Promise<Genre[]> => {
    const response = await http.get(`${API}/genres`);
    return response.data;
  },

  create: async (movie: CreateMovieDto): Promise<Movie> => {
    const response = await http.post(`${API}/movies`, movie);
    return response.data;
  },

  update: async (id: number, movie: Partial<CreateMovieDto>): Promise<void> => {
    await http.put(`${API}/movies/${id}`, movie);
  },

  delete: async (id: number): Promise<void> => {
    await http.delete(`${API}/movies/${id}`);
  },
};
