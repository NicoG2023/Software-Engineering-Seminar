import { http } from './http';

export interface BackendUser {
    username: string;
    email?: string;
    roles: string[];
    sub: string;
    name?: string;
    given_name?: string;
    family_name?: string;
}

export interface TokenValidationResponse {
    valid: boolean;
    user?: BackendUser;
    error?: string;
}

const AUTH_API_URL = import.meta.env.VITE_BUSINESS_API_URL + '/api/auth';

export const userApi = {
    /**
     * Validate a JWT token with the backend
     */
    validateToken: async (token: string): Promise<TokenValidationResponse> => {
        try {
            const response = await http.post(`${AUTH_API_URL}/validate`, { token });
            return response.data;
        } catch (error: any) {
            return {
                valid: false,
                error: error.response?.data?.error || 'Token validation failed'
            };
        }
    },

    /**
     * Get current user information from backend
     */
    getCurrentUser: async (): Promise<BackendUser> => {
        const response = await http.get(`${AUTH_API_URL}/me`);
        return response.data;
    },

    /**
     * Check if current user is admin
     */
    checkAdmin: async (): Promise<{ is_admin: boolean; roles: string[] }> => {
        const response = await http.get(`${AUTH_API_URL}/check-admin`);
        return response.data;
    }
};
