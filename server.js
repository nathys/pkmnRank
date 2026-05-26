const express = require('express');
const path = require('path');

const pokemonRoutes = require('./routes/pokemon');
const ratingsRoutes = require('./routes/ratings');
const carListingsRoutes = require('./routes/carlistings');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' })); // photo uploads send their own 25mb limit per-route
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/pokemon', pokemonRoutes);
app.use('/api', ratingsRoutes);
app.use('/api/car', carListingsRoutes);

// Serve the public listing view for /car/:id
app.get('/car/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'car-view.html'));
});

app.listen(PORT, () => {
  console.log(`pkmnRank running at http://localhost:${PORT}`);
});
