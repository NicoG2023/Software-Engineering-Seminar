// src/api/theaterRoomApi.ts
import { http } from './http';

const FLASK_API = `${import.meta.env.VITE_FLASK_API_URL as string}/api`;

// -------------------------------
// Interfaces
// -------------------------------
export interface TheaterRoom {
  id: number;
  name: string;
  capacity: number;
  location: string | null;
  is_active: boolean;
}

export interface CreateRoomDto {
  name: string;
  capacity: number;
  location?: string;
}

export interface UpdateRoomDto {
  name?: string;
  capacity?: number;
  location?: string;
  is_active?: boolean;
}

// -------------------------------
// API
// -------------------------------
export const theaterRoomApi = {
  // GET /api/rooms
  getAll: async (): Promise<TheaterRoom[]> => {
    const res = await http.get(`${FLASK_API}/rooms`);
    return res.data;
  },

  // GET /api/rooms/:id
  getById: async (id: number): Promise<TheaterRoom> => {
    const res = await http.get(`${FLASK_API}/rooms/${id}`);
    return res.data;
  },

  // POST /api/rooms
  create: async (room: CreateRoomDto): Promise<TheaterRoom> => {
    const res = await http.post(`${FLASK_API}/rooms`, room);
    return res.data;
  },

  // PUT /api/rooms/:id
  update: async (id: number, room: UpdateRoomDto): Promise<void> => {
    await http.put(`${FLASK_API}/rooms/${id}`, room);
  },

  // DELETE /api/rooms/:id
  delete: async (id: number): Promise<void> => {
    await http.delete(`${FLASK_API}/rooms/${id}`);
  },
};
