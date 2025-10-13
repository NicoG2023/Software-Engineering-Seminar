import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppLayout from './AppLayout';
import CatalogPage from '../pages/Catalog/CatalogPage';
import AdminPage from '../pages/Admin/AdminPage';
import NotFound from '../pages/NotFound';
import RequireAuth from '../auth/guards/RequireAuth';
import RequireRole from '../auth/guards/RequireRole';
import UsersManagementPage from '../pages/Admin/UsersManagementPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <CatalogPage /> },
      {
        path: 'admin',
        element: (
          <RequireAuth>
            <RequireRole role="admin">
              <AdminPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'users-management',
        element: (
          <RequireAuth>
            <RequireRole role="admin">
              <UsersManagementPage />
            </RequireRole>
          </RequireAuth>
        ),
      },
      { path: '404', element: <NotFound /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
