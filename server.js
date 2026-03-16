const express = require('express');
const path = require('path');

const pokemonRoutes = require('./routes/pokemon');
const ratingsRoutes = require('./routes/ratings');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/pokemon', pokemonRoutes);
app.use('/api', ratingsRoutes);

app.listen(PORT, () => {
  console.log(`pkmnRank running at http://localhost:${PORT}`);
});
