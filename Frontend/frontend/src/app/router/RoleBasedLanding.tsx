// src/router/RoleBasedLanding.tsx
import { Navigate } from 'react-router-dom';
import CatalogPage from '../../pages/Catalog/CatalogPage';
import { useAuthStrict } from '../../auth/AuthContext';

export default function RoleBasedLanding() {
  const { ready, authenticated, hasRealmRole } = useAuthStrict();

  // Mientras inicializa Keycloak
  if (!ready) {
    return (
      <main className="min-h-screen bg-[#1E1E1E] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-4 border-[#FFDA63] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-300 text-sm">Loading...</p>
        </div>
      </main>
    );
  }

  // No autenticado: catálogo público
  if (!authenticated) {
    return <CatalogPage />;
  }

  // Autenticado → decidir por rol en el realm
  if (hasRealmRole('admin')) {
    return <Navigate to="/users-management" replace />;
  }

  if (hasRealmRole('customer')) {
    return <CatalogPage />;
  }

  // Cualquier otro caso raro → catálogo
  return <CatalogPage />;
}
