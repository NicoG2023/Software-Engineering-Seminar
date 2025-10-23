import { http } from './http';
import type { Movie, WhoAmI } from '../types/domain';

export const CinemaApi = {
  whoAmI: () => http.get<WhoAmI>('/api/auth/whoami').then(r => r.data),
  listMovies: () => http.get<Movie[]>('/api/movies').then(r => r.data),
};
