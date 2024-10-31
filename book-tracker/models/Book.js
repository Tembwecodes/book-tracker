const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookSchema = new Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  genre: { type: String },
  status: { type: String, enum: ['to-read', 'reading', 'finished'], default: 'to-read' },
  rating: { type: Number, min: 1, max: 5 },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

const Book = mongoose.model('Book', bookSchema);
module.exports = Book;