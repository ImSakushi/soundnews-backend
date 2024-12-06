// routes/lyrics.js

const express = require('express');
const router = express.Router();
const Lyric = require('../models/Lyric');

// Obtenir toutes les paroles
// GET /api/lyrics
router.get('/', async (req, res) => {
    try {
        const lyrics = await Lyric.find().populate('music');
        res.json(lyrics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Créer de nouvelles paroles
// POST /api/lyrics
router.post('/', async (req, res) => {
    const { musicId, content } = req.body;

    // Validation des champs requis
    if (!musicId || !content) {
        return res.status(400).json({ message: 'musicId et content sont requis.' });
    }

    // Vérifier si la musique existe
    try {
        const music = await require('../models/Music').findById(musicId);
        if (!music) {
            return res.status(404).json({ message: 'Musique non trouvée.' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

    const lyric = new Lyric({
        music: musicId,
        content
    });

    try {
        const newLyric = await lyric.save();
        // Mettre à jour la musique avec la référence des paroles
        const music = await require('../models/Music').findById(musicId);
        music.lyrics = newLyric._id;
        await music.save();
        res.status(201).json(newLyric);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
