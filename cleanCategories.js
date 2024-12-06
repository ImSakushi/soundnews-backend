const mongoose = require('mongoose');
const Music = require('./models/Music'); // Assurez-vous que le chemin est correct
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', (error) => console.error('Erreur de connexion à MongoDB:', error));
db.once('open', async () => {
    console.log('Connecté à MongoDB');

    try {
        // Trouver les musiques où 'category' est une chaîne de caractères
        const musics = await Music.find({ "category": { "$type": "string" } });

        for (const music of musics) {
            try {
                // Parser la chaîne JSON pour obtenir un tableau
                const parsedCategories = JSON.parse(music.category);

                // Vérifier que c'est bien un tableau
                if (Array.isArray(parsedCategories)) {
                    // Limiter à 3 catégories si nécessaire
                    music.category = parsedCategories.slice(0, 3);
                    await music.save();
                    console.log(`Musique "${music.title}" mise à jour avec les catégories:`, music.category);
                } else {
                    console.warn(`La catégorie de la musique "${music.title}" n'est pas un tableau.`);
                }
            } catch (err) {
                console.error(`Erreur lors du parsing de la catégorie pour la musique "${music.title}":`, err);
            }
        }

        console.log('Mise à jour terminée.');
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
});
