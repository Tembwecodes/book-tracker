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

// Routes
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

// Log Out Route
/*app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});*/

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});