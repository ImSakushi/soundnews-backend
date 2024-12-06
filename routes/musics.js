// routes/musics.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Music = require('../models/Music');
const Lyric = require('../models/Lyric');

// Configuration de Multer pour les fichiers audio
const storageAudio = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/audio/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadAudio = multer({
    storage: storageAudio,
    limits: { fileSize: 50 * 1024 * 1024 }, // Limite de 50MB
    fileFilter: (req, file, cb) => {
        const filetypes = /mp3|wav|ogg/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Seuls les fichiers audio mp3, wav et ogg sont autorisés !'));
    }
});

// Configuration de Multer pour les images
const storageImage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/images/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadImage = multer({
    storage: storageImage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Seules les images JPEG, JPG, PNG et GIF sont autorisées !'));
    }
});

// Middleware pour gérer les erreurs de Multer
const uploadMiddleware = (req, res, next) => {
    const upload = multer().fields([
        { name: 'audio', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 }
    ]);

    upload(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            // Erreur liée à Multer
            return res.status(400).json({ message: err.message });
        } else if (err) {
            // Autres erreurs
            return res.status(400).json({ message: err.message });
        }
        next();
    });
};

// Route GET pour obtenir toutes les musiques
// GET /api/musics
router.get('/', async (req, res) => {
    try {
        const musics = await Music.find().populate('lyrics');
        res.json(musics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Route GET pour obtenir une musique par ID, y compris les paroles
// GET /api/musics/:id
router.get('/:id', getMusic, (req, res) => {
    res.json(res.music);
});

// Route POST pour créer une nouvelle musique avec upload
// POST /api/musics
router.post('/', uploadAudio.single('audio'), uploadImage.single('coverImage'), async (req, res) => {
    try {
        const { title, artist, category, lyricsContent } = req.body;

        // Validation des champs requis
        if (!title || !artist || !category) {
            return res.status(400).json({ message: 'Titre, artiste et catégorie sont requis.' });
        }

        // Vérifier si les fichiers audio et image ont été uploadés
        if (!req.file && !req.files) {
            return res.status(400).json({ message: 'Fichiers audio et image sont requis.' });
        }

        // Construire les URLs des fichiers uploadés
        const audioUrl = req.file ? `${req.protocol}://${req.get('host')}/uploads/audio/${req.file.filename}` : null;
        const coverImage = req.files && req.files.coverImage ? `${req.protocol}://${req.get('host')}/uploads/images/${req.files.coverImage[0].filename}` : null;

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
            category,
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
