// src/types/auth.ts
export type UserRole = 'ADMIN' | 'CUSTOMER';

export type UserResponse = {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: string;
  user: UserResponse;
};
