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

app.use(bodyParser.json())
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

  app.post('/addAccount', async (req, res) => {
    const { email, password, server, port, protocol } = req.body;

    // Check if user is logged in
    if (!req.session.userId) {
        return res.status(401).send('Please log in to add an account');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);  // hash the password

        let query;
        let params;

        // If protocol is IMAP, set imap_server, imap_port, and imap_tls.
        // If protocol is POP, set pop_server, pop_port, and pop_tls.
        if (protocol === "IMAP") {
            query = 'INSERT INTO user_accounts (user_id, email, password, imap_server, imap_port, imap_tls) VALUES (?, ?, ?, ?, ?, ?)';
            params = [req.session.userId, email, hashedPassword, server, port, 1]; // 1 for true
        } else if (protocol === "POP3") {
            query = 'INSERT INTO user_accounts (user_id, email, password, pop_server, pop_port, pop_tls) VALUES (?, ?, ?, ?, ?, ?)';
            params = [req.session.userId, email, hashedPassword, server, port, 1]; // 1 for true
        } else {
            return res.status(400).send('Invalid protocol');
        }

        const [result] = await db.query(query, params);
        
        // You may want to respond with a success message or with the added account
        // In this example, we will just send a success message
        res.status(200).json({ status: 'success', message: 'Account added successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ status: 'error', message: 'Error adding account, please try again' });
    }
});

app.get('/accounts', (req, res) => {
  const userId = req.session.userId; // Get the current user's ID from session data
  db.query('SELECT * FROM user_accounts WHERE user_id = ?', [userId], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).json({ status: 'error', message: 'Error fetching accounts' });
    } else {
      res.status(200).json(results);
    }
  });
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