// backend/migrateCategories.js

const mongoose = require('mongoose');
require('dotenv').config();

const Music = require('./models/Music');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', (error) => console.error('Erreur de connexion à MongoDB:', error));
db.once('open', async () => {
    console.log('Connecté à MongoDB pour la migration');

    try {
        const musics = await Music.find();
        for (let music of musics) {
            if (typeof music.category === 'string') {
                try {
                    const parsedCategory = JSON.parse(music.category);
                    if (Array.isArray(parsedCategory)) {
                        music.category = parsedCategory;
                        await music.save();
                        console.log(`Catégorie mise à jour pour la musique: ${music.title}`);
                    } else {
                        console.warn(`La catégorie de la musique "${music.title}" n'est pas un tableau.`);
                    }
                } catch (e) {
                    console.error(`Erreur de parsing pour la musique "${music.title}":`, e);
                }
            }
        }
        console.log('Migration terminée.');
    } catch (err) {
        console.error('Erreur lors de la migration:', err);
    } finally {
        mongoose.connection.close();
    }
});
