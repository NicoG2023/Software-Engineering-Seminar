// src/App.tsx
import './styles/index.css';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layout principal
import AppLayout from './app/AppLayout';

// Páginas
import Home from './pages/Home';
import MovieList from './pages/movies/MovieList';
// importa más páginas según necesites (Login, Admin, etc.)

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas con el layout global */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<MovieList />} />
        </Route>

        {/* Rutas sin layout (opcional) */}
        {/* <Route path="/login" element={<Login />} /> */}
      </Routes>
    </Router>
  );
}
