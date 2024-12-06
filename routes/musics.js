// routes/musics.js

const express = require('express');
const router = express.Router();
const Music = require('../models/Music');
const Lyric = require('../models/Lyric');

// Route GET pour obtenir toutes les musiques
router.get('/', async (req, res) => {
    try {
        const musics = await Music.find().populate('lyrics');
        res.json(musics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Route GET pour obtenir une musique par ID, y compris les paroles
router.get('/:id', getMusic, (req, res) => {
    res.json(res.music);
});

// Route POST pour créer une nouvelle musique sans upload de fichiers
router.post('/', async (req, res) => {
    try {
        const { title, artist, category, lyricsContent, audioUrl, coverImage } = req.body;

        // Validation des champs requis
        if (!title || !artist || !category || !audioUrl || !coverImage) {
            return res.status(400).json({ message: 'Titre, artiste, catégorie, audioUrl et coverImage sont requis.' });
        }

        // Convertir category en tableau si ce n'est pas déjà le cas
        const categories = Array.isArray(category) ? category : [category];

        // Valider que chaque catégorie est valide
        const validCategories = [
            'Science',
            'Sécurité',
            'Environnement',
            'Technologie',
            'Santé',
            'Politique',
            'Société',
            'Culture',
            'Économie',
            'Sport'
        ];

        const invalidCategories = categories.filter(cat => !validCategories.includes(cat));
        if (invalidCategories.length > 0) {
            return res.status(400).json({ message: `Catégories invalides : ${invalidCategories.join(', ')}` });
        }

        // Créer une nouvelle instance de Lyric si les paroles sont fournies
        let lyric = null;
        if (lyricsContent) {
            lyric = new Lyric({
                content: lyricsContent
            });
            lyric = await lyric.save();
        }

        const music = new Music({
            title,
            artist,
            audioUrl,
            category: categories, // Utiliser le tableau de catégories
            coverImage,
            lyrics: lyric ? lyric._id : null
        });

        const newMusic = await music.save();

        // Si les paroles ont été créées, mettre à jour la référence dans Lyric
        if (lyric) {
            lyric.music = newMusic._id;
            await lyric.save();
        }

        // Remplir les informations de Lyric dans la réponse
        const populatedMusic = await Music.findById(newMusic._id).populate('lyrics');

        res.status(201).json(populatedMusic);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/musics/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
      // Supprimer la musique par son ID
      const deletedMusic = await Music.findByIdAndDelete(id);

      if (!deletedMusic) {
          return res.status(404).json({ message: 'Musique non trouvée.' });
      }

      // Optionnel : Supprimer les paroles associées
      await Lyric.deleteMany({ music: id });

      res.status(200).json({ message: 'Musique supprimée avec succès.', music: deletedMusic });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erreur lors de la suppression de la musique.' });
  }
});

// Middleware pour obtenir une musique par ID
async function getMusic(req, res, next) {
    let music;
    try {
        music = await Music.findById(req.params.id).populate('lyrics');
        if (!music) {
            return res.status(404).json({ message: 'Musique non trouvée' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

    res.music = music;
    next();
}

module.exports = router;
