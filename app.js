const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const imaps = require('imap-simple');
const MailParser = require('mailparser').MailParser;


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

app.get('/getRecentMail', async (req, res) => {
  const userId = req.session.userId;
  
  const [accounts] = await db.query('SELECT * FROM user_accounts WHERE user_id = ?', [userId]);

  const account = accounts[0];

  const config = {
    imap: {
      user: account.email,
      password: account.password, // make sure to decrypt password
      host: account.imap_server,
      port: account.imap_port,
      tls: true,
      authTimeout: 3000
    }
  };

  imaps.connect(config).then(function (connection) {
    return connection.openBox('INBOX').then(function () {
      var now = new Date();
      now.setDate(now.getDate() - 1);
      var searchCriteria = [['SINCE', now]];
      var fetchOptions = { bodies: ['HEADER', 'TEXT'], struct: true };
      
      return connection.search(searchCriteria, fetchOptions).then(function (results) {
        let emailPromises = results.map(function (result) {
          return new Promise((resolve, reject) => {
            var header = result.parts.filter(function (part) {
              return part.which === 'HEADER';
            })[0].body;
      
            var rawEmail = result.parts.filter(function (part) {
              return part.which === 'TEXT';
            })[0].body;
            
            let email = {
              from: header.from[0],
              date: header.date[0],
              subject: header.subject[0],
              teaser: '',
              text: '',
              html: ''
            };

      
            let mailparser = new MailParser();
          
mailparser.on('data', function(data) {
  if (data.type === 'text') {

    let text = data.text;
    text = text.replace(/--_=_swift.*_=_/, ''); // remove MIME boundary
    text = text.replace(/Content-Type:.*charset=utf-8/, ''); // remove Content-Type header

    email.text = text; // Store the full text
    if (!email.teaser) {
      // If we didn't already find a teaser, take the first 100 characters of this part as the teaser
      email.teaser = text.slice(0, 100);
    }
  }

  if (data.type === 'html') {
    email.html = data.html; // Store the full html
  }
});
            mailparser.on('end', function() {
              // If there's no 'data' event (e.g. the email is empty), resolve the promise anyway
              resolve(email);
            });
            mailparser.write(rawEmail.toString('utf8'));
            mailparser.end();
          });
        });
      
        Promise.all(emailPromises)
          .then(emails => {
            console.log(emails);
            res.json(emails);
          });
      });
    });
  });
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
        const hashedPassword =password;  // TODO: hash the password -- Must be reversable

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

app.get('/accounts', async (req, res) => {
  console.log('GET request received at /accounts'); // Log to ensure the route is being hit

  const userId = req.session.userId; // Get userId from session
  console.log('User ID: ', userId); 

  const query = "SELECT * FROM user_accounts WHERE user_id = ?";  

  try {
    const [results] = await db.query(query, [userId]);
    console.log('Database query results: ', results); // Log results for debugging
    res.json(results);
  } catch (err) {
    console.error('Database query error: ', err); // Log error message
    res.status(500).send('Server error');
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