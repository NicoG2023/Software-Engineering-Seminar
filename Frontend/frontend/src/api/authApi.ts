import { authHttp } from './http';
import type { UserResponse, UserRole } from '../types/auth';

type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

export const AuthApi = {
  /**
   * Registers a new user with default CUSTOMER role.
   * Returns the created user.
   */
  register: (payload: RegisterPayload) =>
    authHttp
      .post<UserResponse>('/auth/register', payload)
      .then(r => r.data),

  /**
   * Returns all users (ADMIN only).
   */
  listUsers: () =>
    authHttp.get<UserResponse[]>('/auth/users').then(r => r.data),

  /**
   * Changes the role of a user and returns the updated user.
   */
  changeRole: (id: number, role: UserRole) =>
    authHttp
      .put<UserResponse>(`/auth/users/${id}/role`, { role })
      .then(r => r.data),

  /**
   * Enables or disables a user and returns the updated user.
   */
  setEnabled: (id: number, enabled: boolean) =>
    authHttp
      .patch<UserResponse>(`/auth/users/${id}/enabled`, { enabled })
      .then(r => r.data),
};
