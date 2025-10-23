import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Button, Box, Paper,
  TextField, CircularProgress, Grid
} from '@mui/material';
import { movieService } from '../../../../src/services/api';
import { MovieFormData } from '../../../../src/types';

const MovieForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<MovieFormData>({
    title: '',
    genre: '',
    duration: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMovie = React.useCallback(async () => {
    try {
      setLoading(true);
      const movie = await movieService.getMovie(Number(id));
      setFormData({
        title: movie.title,
        genre: movie.genre,
        duration: movie.duration
      });
    } catch {
      setError('Failed to load movie data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditMode) fetchMovie();
  }, [isEditMode, fetchMovie]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (isEditMode) {
        await movieService.updateMovie(Number(id), formData);
      } else {
        await movieService.createMovie(formData);
      }
      navigate('/movies');
    } catch {
      setError('Failed to save movie');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          {isEditMode ? 'Edit Movie' : 'Add New Movie'}
        </Typography>

        {error && (
          <Box sx={{ mb: 2, color: 'error.main' }}>
            <Typography>{error}</Typography>
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="title"
                label="Movie Title"
                fullWidth
                required
                value={formData.title}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="genre"
                label="Genre"
                fullWidth
                required
                value={formData.genre}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="duration"
                label="Duration (minutes)"
                type="number"
                fullWidth
                required
                value={formData.duration}
                onChange={handleChange}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : 'Save'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/movies')}
                fullWidth
              >
                Cancel
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default MovieForm;