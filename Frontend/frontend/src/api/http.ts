// src/api/http.ts
import axios, { type AxiosRequestHeaders, type InternalAxiosRequestConfig } from 'axios';

const businessBase = (import.meta.env.VITE_FLASK_API_URL
  || import.meta.env.VITE_BUSINESS_API_URL
  || import.meta.env.VITE_API_URL
  || 'http://localhost:5000') as string;

const authBase = (import.meta.env.VITE_AUTH_API_URL
  || 'http://localhost:8081') as string;

const attachAuthHeader = (config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    const headers: AxiosRequestHeaders = config.headers ?? {};
    headers.Authorization = `Bearer ${token}`;
    config.headers = headers;
  }
  return config;
};

export const http = axios.create({
  baseURL: businessBase,
});

http.interceptors.request.use((config) => attachAuthHeader(config));

export const authHttp = axios.create({
  baseURL: authBase,
});

authHttp.interceptors.request.use((config) => attachAuthHeader(config));
