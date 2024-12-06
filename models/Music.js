const mongoose = require('mongoose');

const MusicSchema = new mongoose.Schema({
    title: { type: String, required: true },
    artist: { type: String, required: true },
    audioUrl: { type: String, required: true },
    lyrics: { type: mongoose.Schema.Types.ObjectId, ref: 'Lyric' },
    category: { type: String, enum: ['Politique', 'Économie', 'Société'], required: true },
    coverImage: { type: String }, // URL de l'image de couverture
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Music', MusicSchema);
