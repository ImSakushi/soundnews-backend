
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connexion à MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', (error) => console.error('Erreur de connexion à MongoDB:', error));
db.once('open', () => console.log('Connecté à MongoDB'));

// Routes
const musicsRouter = require('./routes/musics');
const lyricsRouter = require('./routes/lyrics');

app.use('/api/musics', musicsRouter);
app.use('/api/lyrics', lyricsRouter);

// Page d'accueil (optionnel)
app.get('/', (req, res) => {
    res.send('Bienvenue sur l\'API SoundNews');
});

// Démarrage du serveur
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Serveur en cours d'exécution sur le port ${PORT}`));
