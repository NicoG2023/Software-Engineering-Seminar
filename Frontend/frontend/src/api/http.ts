import axios from 'axios';
// import { keycloak } from '../auth/keycloak';

export const http = axios.create({
  baseURL: '', // Eliminamos la dependencia de variables de entorno
});

// Deshabilitamos temporalmente la autenticación
http.interceptors.request.use(async (config) => {
  // Autenticación deshabilitada temporalmente
  return config;
});
