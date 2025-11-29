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

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <RoleBasedLanding /> },

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

      /* -----------------------------
         MOVIES
      ------------------------------*/
      {
        path: 'movies',
        element: (
          <RequireAuth>
            <RequireRole role="admin">
              <MovieList />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'movies/:id',
        element: (
          <RequireAuth>
            <RequireRole role="Customer">
              <MovieDetail />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'movies/new',
        element: (
          <RequireAuth>
            <RequireRole role="admin">
              <MovieForm />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'movies/edit/:id',
        element: (
          <RequireAuth>
            <RequireRole role="admin">
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
            <RequireRole role="admin">
              <RoomList />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'rooms/new',
        element: (
          <RequireAuth>
            <RequireRole role="admin">
              <RoomForm />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'rooms/edit/:id',
        element: (
          <RequireAuth>
            <RequireRole role="admin">
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
            <RequireRole role="admin">
              <ScreeningList />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'screenings/new',
        element: (
          <RequireAuth>
            <RequireRole role="admin">
              <ScreeningForm />
            </RequireRole>
          </RequireAuth>
        ),
      },
      {
        path: 'screenings/edit/:id',
        element: (
          <RequireAuth>
            <RequireRole role="admin">
              <ScreeningForm />
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
