import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppLayout from './AppLayout';
import AdminPage from '../pages/Admin/AdminPage';
import NotFound from '../pages/NotFound';
import RequireAuth from '../auth/guards/RequireAuth';
import RequireRole from '../auth/guards/RequireRole';
import UsersManagementPage from '../pages/Admin/UsersManagementPage';
import MovieList from '../pages/Admin/movies/MovieList';
import MovieDetail from '../pages/Admin/movies/MovieDetail';
import MovieForm from '../pages/Admin/movies/MovieForm';
import RoleBasedLanding from './router/RoleBasedLanding';
import RoomList from '../pages/Admin/theaterRooms/RoomList';
import RoomForm from '../pages/Admin/theaterRooms/RoomForm';
import ScreeningList from '../pages/Admin/screenings/ScreeningList';
import ScreeningForm from '../pages/Admin/screenings/ScreeningForm';
import LoginPage from '../pages/Auth/LoginPage';
import RegisterPage from '../pages/Auth/RegisterPage';
import CatalogPage from '../pages/Catalog/CatalogPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <RoleBasedLanding /> },

      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'admin',
        element: (
          <RequireAuth>
            <RequireRole role="ADMIN">
              <AdminPage />
            </RequireRole>
          </RequireAuth>
        ),
      },

      {
        path: 'users-management',
        element: (
          <RequireAuth>
            <RequireRole role="ADMIN">
              <UsersManagementPage />
            </RequireRole>
          </RequireAuth>
        ),
      },

      /* -----------------------------
         MOVIES
      ------------------------------*/
      {
        path: 'movies',
        element: (
          <RequireAuth>
            <RequireRole role="ADMIN">
              <MovieList />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'movies/:id',
        element: (
          <RequireAuth>
            <RequireRole role="CUSTOMER">
              <MovieDetail />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'movies/new',
        element: (
          <RequireAuth>
            <RequireRole role="ADMIN">
              <MovieForm />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'movies/edit/:id',
        element: (
          <RequireAuth>
            <RequireRole role="ADMIN">
              <MovieForm />
            </RequireRole>
          </RequireAuth>
        ),
      },

      /* -----------------------------
         THEATER ROOMS
      ------------------------------*/
      {
        path: 'rooms',
        element: (
          <RequireAuth>
            <RequireRole role="ADMIN">
              <RoomList />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'rooms/new',
        element: (
          <RequireAuth>
            <RequireRole role="ADMIN">
              <RoomForm />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'rooms/edit/:id',
        element: (
          <RequireAuth>
            <RequireRole role="ADMIN">
              <RoomForm />
            </RequireRole>
          </RequireAuth>
        ),
      },

      /* -----------------------------
         Screenings
      ------------------------------*/
      {
        path: 'screenings',
        element: (
          <RequireAuth>
            <RequireRole role="ADMIN">
              <ScreeningList />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'screenings/new',
        element: (
          <RequireAuth>
            <RequireRole role="ADMIN">
              <ScreeningForm />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'screenings/edit/:id',
        element: (
          <RequireAuth>
            <RequireRole role="ADMIN">
              <ScreeningForm />
            </RequireRole>
          </RequireAuth>
        ),
      },

      { path: '404', element: <NotFound /> },
      {
        path: 'catalog',
        element: <CatalogPage />,
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
