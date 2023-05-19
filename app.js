const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'))
app.set('views', path.join(__dirname, 'public'));
app.use(bodyParser.urlencoded({ extended: false }))



// Use the session middleware
app.use(session({
  secret: 'Frog Eye Salad AND Third Eye Sam',  // you should use a unique string for the secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // if you are using https use { secure: true }
}))

// Database connection
const db = mysql.createPool({
    host: 'outlawslosttreasure.com',
    user: 'ducimus_gptmailer',
    password: 'nP5UEjY=%$W1',
    database: 'ducimus_gptmail',
});

db.getConnection()
    .then(() => {
        console.log('Connected to database');
    })
    .catch(err => {
        console.error('Failed to connect to database:', err);
        process.exit(1);  // Exit the process with a failure code
    });

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);  // hash the password

    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    const [result] = await db.query(query, [username, hashedPassword]);
    res.redirect('/login');
  } catch (err) {
    console.log(err);
    res.send('Error signing up, please try again');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    const query = 'SELECT * FROM users WHERE username = ?';
    try {
      const [results] = await db.query(query, [username]);
      if (results.length > 0) {
        const match = await bcrypt.compare(password, results[0].password);
        if (match) {
          req.session.userId = results[0].id;
          res.redirect('/');
        } else {
          res.send('Username or password incorrect');
        }
      } else {
        res.send('Username or password incorrect');
      }
    } catch(err) {
      console.log(err);
      res.send('An error occurred');
    }
  });
  
  // add a route for your index page
  app.get('/', (req, res) => {
    if (req.session.userId) {
      res.render('index');
    } else {
      res.redirect('/login');
    }
  });
  
  app.listen(3000, () => {
    console.log('Server started on port 3000');
  });