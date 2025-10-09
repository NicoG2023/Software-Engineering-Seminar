import { http } from './http';

export const AuthApi = {
  createUser: (payload: {username:string; email:string; password:string}) =>
    http.post<{id:string}>('/api/auth/users', payload).then(r => r.data),
  listUsers: (q?:string) =>
    http.get('/api/auth/users', { params: { q } }).then(r => r.data),
};
