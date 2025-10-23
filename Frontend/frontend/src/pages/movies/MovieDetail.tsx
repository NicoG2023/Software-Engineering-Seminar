import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container, Typography, Button, Box, Paper,
  CircularProgress, Divider, Chip, Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { movieService } from '../../../../src/services/api';
import { Movie } from '../../../../src/types';

const MovieDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMovie = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await movieService.getMovie(Number(id));
      setMovie(data);
    } catch {
      setError('Failed to load movie data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMovie();
  }, [fetchMovie]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        await movieService.deleteMovie(Number(id));
        navigate('/movies');
      } catch {
        setError('Failed to delete movie');
      }
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !movie) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error" variant="h6">
            {error || 'Movie not found'}
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            component={RouterLink}
            to="/movies"
            sx={{ mt: 2 }}
          >
            Back to Movies
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} component={RouterLink} to="/movies">
            Back to Movies
          </Button>
          <Box>
            <Button
              startIcon={<EditIcon />}
              component={RouterLink}
              to={`/movies/edit/${movie.id}`}
              sx={{ mr: 1 }}
            >
              Edit
            </Button>
            <Button startIcon={<DeleteIcon />} color="error" onClick={handleDelete}>
              Delete
            </Button>
          </Box>
        </Box>

        <Typography variant="h4" component="h1" gutterBottom>
          {movie.title}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle1" color="text.secondary">
              Genre
            </Typography>
            <Chip label={movie.genre} color="primary" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Typography variant="subtitle1" color="text.secondary">
              Duration
            </Typography>
            <Typography>{movie.duration} minutes</Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Screenings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            No screenings available for this movie yet.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default MovieDetail;