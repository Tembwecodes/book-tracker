const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
  secret: 'yourSecretKey',
  resave: false,
  saveUninitialized: false
}));
app.use(flash());

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// User Model
const User = require('./models/User');
const Book = require('./models/Book');

// Routes

// Middleware to check if user is the owner of the book
async function checkBookOwnership(req, res, next) {
  try {
    const book = await Book.findById(req.params.id);
    if (book.userId.equals(req.session.userId)) {
      return next();
    } else {
      res.redirect('/books');
    }
  } catch (error) {
    console.error('Error checking book ownership:', error);
    res.redirect('/books');
  }
}

app.get('/', (req, res) => {
  res.render('index');
});

// Sign Up Route
app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashedPassword });
  await newUser.save();
  res.redirect('/login');
});

// Log In Route
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.userId = user._id;
    res.redirect('/');
  } else {
    res.redirect('/login');
  }
});



app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

//Book routes
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  } else {
    res.redirect('/login');
  }
}

// Apply the middleware to routes that require authentication
app.get('/books/new', isAuthenticated, (req, res) => {
  res.render('newBook');
});

app.post('/books', isAuthenticated, async (req, res) => {
  const { title, author, genre, status, rating } = req.body;
  const newBook = new Book({ title, author, genre, status, rating, userId: req.session.userId });
  try {
    await newBook.save();
    res.redirect('/books');
  } catch (error) {
    console.error('Error adding book:', error);
    res.redirect('/books/new');
  }
});

app.get('/books', isAuthenticated, async (req, res) => {
  const books = await Book.find({ userId: req.session.userId });
  res.render('books', { books });
});

//edit book
app.get('/books/:id/edit', isAuthenticated, checkBookOwnership, async (req, res) => {
  const book = await Book.findById(req.params.id);
  res.render('editBook', { book });
});

app.post('/books/:id', isAuthenticated, checkBookOwnership, async (req, res) => {
  const { title, author, genre, status, rating } = req.body;
  await Book.findByIdAndUpdate(req.params.id, { title, author, genre, status, rating });
  res.redirect('/books');
});

// delete Book 
app.post('/books/:id/delete', isAuthenticated, checkBookOwnership, async (req, res) => {
  await Book.findByIdAndDelete(req.params.id);
  res.redirect('/books');
});



// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});