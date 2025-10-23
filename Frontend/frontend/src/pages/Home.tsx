import React from 'react';
import { Typography, Button, Box, Paper, Grid } from '@mui/material'; // ✅ usamos Grid estable
import { Link as RouterLink } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <>
      <Paper
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to Movie Booking System
        </Typography>
        <Typography
          variant="h5"
          color="textSecondary"
          paragraph
          align="center"
        >
          Browse our selection of movies and book your tickets online
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            component={RouterLink}
            to="/movies"
          >
            Browse Movies
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              Latest Movies
            </Typography>
            <Typography paragraph>
              Check out our latest movie releases and be the first to watch
              them.
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              Easy Booking
            </Typography>
            <Typography paragraph>
              Book your tickets online with just a few clicks and avoid waiting
              in line.
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              Special Offers
            </Typography>
            <Typography paragraph>
              Don't miss our special offers and discounts for regular customers.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

export default Home;