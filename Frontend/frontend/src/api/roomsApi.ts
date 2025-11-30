import { http } from './http'

export interface Room {
  id: number
  name: string
  capacity: number
  location?: string
}

const BASE = '/api'

export const roomsApi = {
  list: async (): Promise<Room[]> => {
    const res = await http.get(`${BASE}/rooms`)
    return res.data
  },
}
