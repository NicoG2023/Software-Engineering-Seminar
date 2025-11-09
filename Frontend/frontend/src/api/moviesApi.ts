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

// Flask corre en 5000 y el blueprint está montado en /api
const MOVIES_API_URL = 'http://127.0.0.1:5000/api';

export const moviesApi = {
  getAll: async (filters?: { genre?: string; title?: string }): Promise<Movie[]> => {
    let url = `${MOVIES_API_URL}/movies`;

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
    const response = await http.get(`${MOVIES_API_URL}/movies/${id}`);
    return response.data;
  },

  create: async (movie: CreateMovieDto): Promise<Movie> => {
    const response = await http.post(`${MOVIES_API_URL}/movies`, movie);
    return response.data;
  },

  update: async (id: number, movie: Partial<CreateMovieDto>): Promise<void> => {
    await http.put(`${MOVIES_API_URL}/movies/${id}`, movie);
  },

  delete: async (id: number): Promise<void> => {
    await http.delete(`${MOVIES_API_URL}/movies/${id}`);
  },
};
