const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const Imap = require('imap')
const MailParser = require('mailparser').MailParser;
const inspect = require('util').inspect;
var  fs = require('fs')


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

app.get('deleteEmail/:UID', async (req, res) => {

  

});

app.get('/getRecentMail/:start/:end', async (req, res) => {
  const userId = req.session.userId;
  let start = req.params.start;
  let end = req.params.end;

  const [accounts] = await db.query('SELECT * FROM user_accounts WHERE user_id = ?', [userId]);

  const account = accounts[0];

  // TODO: decrypt password
  const decryptedPassword = account.password; 

  var imap = new Imap({
    user: account.email,
    password: decryptedPassword,
    host: account.imap_server,
    port: account.imap_port,
    tls: true
  });

  function openInbox(cb) {
    imap.openBox('INBOX', true, cb);
  }

  imap.once('ready', function() {
    openInbox(function(err, box) {
      if (err) throw err;

      imap.search(['ALL'], function(err, results) {
        if (err) throw err;

        let total = results.length; // total number of messages
        let actualStart = start === '*' ? Math.max(1, total - end + 1) : start;
        let actualEnd = start === '*' ? total : end;

        let f = imap.fetch(`${actualStart}:${actualEnd}`, {
          bodies: '',
          struct: true
        });
      
        let mails = [];

        let processing = 0; // Keep track of how many emails are currently being processed

        f.on('message', function(msg, seqno) {
          processing++; // Increment the counter when starting to process a new email
          console.log('Message no. ' + seqno);

          var parser = new MailParser();
          let mailData = {};

          parser.on('headers', function(headers) {
            const subject = headers.get('subject');
            const sender = headers.get('from').text;
            const recipients = headers.get('to').text;
            const dateHeader = headers.get('date');
        
            const date = dateHeader ? new Date(dateHeader) : new Date();
        
            if (isNaN(date.getTime())) {
              console.error('Invalid date in email:', dateHeader);
              return;
            }
        
            mailData = {
              seqno: seqno,
              from: sender,
              date: date.toISOString(),
              subject: subject,
              recipients: recipients,
              time: date.getTime(),
            };
          });
        
          parser.on('data', function(data) {
            if (data.type === 'text') {
              const body = data.text;
              const textPreview = body.substring(0,100);
              
              mailData.body = body;
              mailData.teaser = textPreview;
            }
              
            if (data.type === 'html') {
              mailData.html = data.html;
            }
          
            // Check for attachments
            if (data.type === 'attachment') {
              data.content.on('end', function() {
                // Release the attachment data when its stream ends
                data.release();
              });

              // Create a directory named after the account's email if it doesn't exist
              let accountDirectory = './attachments/' + account.email.replace(/[@.]/g, '_'); // replace . and @ symbols with underscore

              fs.mkdir(accountDirectory, { recursive: true }, (err) => {
                if (err) throw err;
              });

              // Save the attachment in the account-specific directory
              data.content.pipe(fs.createWriteStream(accountDirectory + '/' + data.filename));
              console.log('Got attachment: ', data.filename);
            }
          });
      
        parser.on('end', function() {
            console.log(`Parser end event for message ${seqno}`);
            mails.push(mailData);
            processing--; // Decrement the counter when finished processing an email
          });

          parser.on('error', function(err) {
            console.log("MailParser error:", err);
          });
          
          msg.on('body', function(stream, info) {
            stream.pipe(parser);
          });
        
          msg.once('end', function() {
            console.log(`Message end event for message ${seqno}`);
          });
        });
        
        f.once('error', function(err) {
          console.log('Fetch error: ' + err);
        });
        
        f.once('end', function() {
          const checkProcessingDone = setInterval(function() {
            if (processing === 0) { // Check if all emails have finished processing
              clearInterval(checkProcessingDone);
              console.log('Done fetching all messages!');
              console.log(mails);
              imap.end();
              res.json(mails);
            }
          }, 100);
        });
      });
    });
  });

  imap.once('error', function(err) {
    console.log(err);
  });

  imap.once('end', function() {
    console.log('Connection ended');
  });

  imap.connect();
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