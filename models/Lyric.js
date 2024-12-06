const mongoose = require('mongoose');

const LyricSchema = new mongoose.Schema({
    music: { type: mongoose.Schema.Types.ObjectId, ref: 'Music' },
    content: { type: String, required: true }, // Contenu des paroles (peut-être en format LRC)
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lyric', LyricSchema);
