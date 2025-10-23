import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Container, Typography, Button, Box, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  TextField, Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { movieService } from '../../../../src/services/api';
import { Movie } from '../../../../src/types';

const MovieList: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [titleFilter, setTitleFilter] = useState<string>('');
  const [genreFilter, setGenreFilter] = useState<string>('');

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async (filters?: { title?: string; genre?: string }) => {
    try {
      setLoading(true);
      const data = await movieService.getMovies(filters);
      setMovies(data);
    } catch (error) {
      console.error('Error fetching movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        await movieService.deleteMovie(id);
        fetchMovies(); // Refresh the list
      } catch (error) {
        console.error('Error deleting movie:', error);
      }
    }
  };

  const handleFilter = () => {
    const filters: { title?: string; genre?: string } = {};
    if (titleFilter) filters.title = titleFilter;
    if (genreFilter) filters.genre = genreFilter;
    fetchMovies(filters);
  };

  const handleClearFilters = () => {
    setTitleFilter('');
    setGenreFilter('');
    fetchMovies();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Movies
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/movies/new"
        >
          Add Movie
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Filter Movies
        </Typography>
        <Grid container spacing={2} alignItems="center" sx={{ width: '100%' }}>
          <Grid size={{ xs: 12, sm: 5 }}>
            <TextField
              label="Title"
              variant="outlined"
              fullWidth
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 5 }}>
            <TextField
              label="Genre"
              variant="outlined"
              fullWidth
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleFilter}
                fullWidth
              >
                Filter
              </Button>
              <Button 
                variant="outlined" 
                onClick={handleClearFilters}
                fullWidth
              >
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Genre</TableCell>
              <TableCell>Duration (min)</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">Loading...</TableCell>
              </TableRow>
            ) : movies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">No movies found</TableCell>
              </TableRow>
            ) : (
              movies.map((movie) => (
                <TableRow key={movie.id}>
                  <TableCell>{movie.id}</TableCell>
                  <TableCell>{movie.title}</TableCell>
                  <TableCell>{movie.genre}</TableCell>
                  <TableCell>{movie.duration}</TableCell>
                  <TableCell align="center">
                    <IconButton 
                      component={RouterLink} 
                      to={`/movies/edit/${movie.id}`}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDelete(movie.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default MovieList;