import { http } from './http'

export interface Room {
  id: number
  name: string
  capacity: number
  location?: string
}

const BASE = (import.meta.env.VITE_BUSINESS_API_URL ?? 'http://localhost:5000') + '/api'

export const roomsApi = {
  list: async (): Promise<Room[]> => {
    const res = await http.get(`${BASE}/rooms`)
    return res.data
  },
}
