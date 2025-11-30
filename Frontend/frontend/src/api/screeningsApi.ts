// src/api/screeningsApi.ts
import { http } from './http';

const API = `/api`;

// ----------- Types -----------

export interface Screening {
  id: number;
  movie_id: number;
  room_id: number;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  price?: number | null;
  available_seats: number;
  room?: string | null; // room name
}

export interface CreateScreeningDto {
  movie_id: number;
  room_id: number;
  date: string;  // "2025-01-10"
  time: string;  // "19:30"
  price?: number | null;
}

export interface UpdateScreeningDto {
  movie_id?: number;
  room_id?: number;
  date?: string;
  time?: string;
  price?: number | null;
  available_seats?: number;
}

// ----------- API -----------

export const screeningsApi = {
  /** Create new screening */
  create: async (payload: CreateScreeningDto): Promise<{ message: string; id: number }> => {
    const response = await http.post(`${API}/screenings`, payload);
    return response.data;
  },

  /** Get screenings by movie */
  getByMovie: async (movieId: number): Promise<Screening[]> => {
    const response = await http.get(`${API}/screenings/${movieId}`);
    return response.data;
  },

  /** Get a single screening by ID */
  getById: async (id: number): Promise<Screening> => {
    const response = await http.get(`${API}/screenings/id/${id}`);
    return response.data;
  },

  /** Update a screening */
  update: async (id: number, payload: UpdateScreeningDto): Promise<void> => {
    await http.put(`${API}/screenings/${id}`, payload);
  },

  /** Soft delete a screening */
  delete: async (id: number): Promise<void> => {
    await http.delete(`${API}/screenings/${id}`);
  },

  /** (Optional) get all screenings — útil para admin panel */
  getAll: async (): Promise<Screening[]> => {
    const response = await http.get(`${API}/screenings-all`);
    return response.data;
  },
};
