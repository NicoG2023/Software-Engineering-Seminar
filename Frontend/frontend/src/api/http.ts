import axios, { type AxiosRequestHeaders, type InternalAxiosRequestConfig } from 'axios';
import { keycloak } from '../auth/keycloak';

const base = (import.meta.env.VITE_FLASK_API_URL
  || import.meta.env.VITE_BUSINESS_API_URL
  || import.meta.env.VITE_API_URL
  || 'http://localhost:5000') as string;

export const http = axios.create({
  baseURL: base,
});

http.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (keycloak.authenticated) {
    await keycloak.updateToken(60).catch(() => keycloak.login());
    if (keycloak.token) {
      const headers: AxiosRequestHeaders = config.headers ?? {};
      headers.Authorization = `Bearer ${keycloak.token}`;
      config.headers = headers;
    }
  }
  return config;
});
