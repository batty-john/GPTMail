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

/*********************************************
 * 
 * 
 * 
 *******************************************/

app.get('/signup', (req, res) => {
  res.render('signup');
});

/*********************************************
 * 
 * 
 * 
 *******************************************/
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

/*********************************************
 * 
 * 
 * 
 *******************************************/
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
  
 /*********************************************
 * 
 * 
 * 
 *******************************************/
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
        
         
        // Assuming you have inserted the account in the account table and got the insertId
        let accountId = result.insertId;
      
        try {
          await getAllMailHeaders(accountId, req.session.userId, db);
        } catch (error) {
          console.log(error);
          res.status(500).json({ status: 'error', message: 'Error fetching email headers, please try again' });
          return;
        }
      
      res.status(200).json({ status: 'success', message: 'Account added successfully' });
      
  } catch (err) {
      console.log(err);
      res.status(500).json({ status: 'error', message: 'Error adding account, please try again' });
  }
});

/*********************************************
 * 
 * 
 * 
 *******************************************/
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


/*********************************************
 * 
 * 
 * 
 *******************************************/
app.get('/getUserMail/:accountId', async (req, res) => {
  const accountId = req.params.accountId;

  // Check if the user is logged in and the accountId belongs to them
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).send('Not logged in');
  }

  const [accounts] = await db.query('SELECT * FROM user_accounts WHERE id = ?', [accountId]);
  const account = accounts[0]
  if (account.user_id !== userId) {
    return res.status(403).send('Not authorized to access this account');
  }

  // Fetch the emails
  let [emails] = await db.query('SELECT * FROM emails WHERE account_id = ?', [accountId]);

  // If there are no emails for this account, fetch them
  if (emails.length === 0) {
    try {
      await getAllMailHeaders(accountId, userId, db);
      // Fetch the emails again after getting them
      [emails] = await db.query('SELECT * FROM emails WHERE account_id = ?', [accountId]);
    } catch (error) {
      console.error('Failed to fetch mail headers:', error);
      return res.status(500).send('Failed to fetch mail headers');
    }
  }

  // Send the emails to the client
  res.json(emails);
});

/*********************************************
 * 
 * 
 * 
 *******************************************/
async function insertEmailHeader(accountId, headers) {
  // Process the headers to extract the necessary information
  let from = headers.get('from').text;
  let to = headers.get('to').text;
  let subject = headers.get('subject');
  let date = headers.get('date');
  
  // Insert the processed headers into the database
  const [result] = await db.query('INSERT INTO emailheaders (accountId, from, to, subject, date) VALUES (?, ?, ?, ?, ?)', [accountId, from, to, subject, date]);
  return result.insertId;
}

/*********************************************
 * 
 * 
 * 
 *******************************************/
async function getAllMailHeaders(accountId, userId, db) {

  console.log("accountID: " + accountId);
  console.log("userID: " + userId);
  const [accounts] = await db.query('SELECT * FROM user_accounts WHERE id = ?', [accountId]);

  const account = accounts[0];

  console.log("queried account id: " + account.user_id);
  // Ensure that the requested account belongs to the logged-in user
  if (account.user_id !== userId) {
    throw new Error('Unauthorized');
  }

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
  
        let f = imap.fetch(results, {
          bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE CC BCC REPLY-TO)', 'BODY[]'],
          struct: true
        });
  
        f.on('message', async function(msg, seqno) {
          var parser = new MailParser();
  
          msg.on('body', function(stream) {
            stream.pipe(parser);
          });
  
          parser.on('data', async function(data) {
            if (data.type === 'headers') {
              let headers = data.headers;
  
              const subject = headers.get('subject');
              const sender = headers.get('from').text;
              let recipients = '';
              if (headers.get('to')) {
                recipients = headers.get('to').text;
              }
              const ccRecipients = headers.get('cc') ? headers.get('cc').text : '';
              const bccRecipients = headers.get('bcc') ? headers.get('bcc').text : '';
              const replyTo = headers.get('reply-to') ? headers.get('reply-to').text : '';
              const dateHeader = headers.get('date');
              const date = dateHeader ? new Date(dateHeader) : new Date();
              let mysqlFormattedDate = date.toISOString().slice(0, 19).replace('T', ' ');
  
              if (isNaN(date.getTime())) {
                console.error('Invalid date in email:', dateHeader);
                return;
              }
  
              let mailData = {
                uid: seqno,
                account_id: accountId,
                sender: sender,
                recipients: recipients,
                cc_recipients: ccRecipients,
                bcc_recipients: bccRecipients,
                reply_to: replyTo,
                subject: subject,
                date: mysqlFormattedDate,
                isread: account.isread,
                isflagged: account.isflagged,
                importance: account.importance
              };
  
              // Insert the header data into the database
              const sql = 'INSERT INTO emails SET ?';
              await db.query(sql, mailData);
            }
  
            if (data.type === 'text') {
              // This is where you can handle plain text body and HTML body
              let mailBodyData = {
                uid: seqno,
                account_id: accountId,
                plainTextBody: data.text ? data.text : null,
                HTMLBody: data.html ? data.html : null,
                isHTML: data.html ? true : false
              };
  
              // Assuming you have a different table to store email bodies
              const sqlBody = 'INSERT INTO email_bodies SET ?';
              await db.query(sqlBody, mailBodyData);
            }
          });
  
          f.once('error', function(err) {
            console.log('Fetch error: ' + err);
          });
  
          f.once('end', function() {
            console.log('Done fetching all messages!');
            imap.end();
            res.json({ success: true, message: 'All email headers fetched and stored.' });
          });
        });
      });
    });
  });
  

 /*********************************************
 * 
 * 
 * 
 *******************************************/
  app.get('/', (req, res) => {
    if (req.session.userId) {
      res.render('index');
    } else {
      res.redirect('/login');
    }
  });
  
  /*********************************************
 * 
 * 
 * 
 *******************************************/
  app.listen(3000, () => {
    console.log('Server started on port 3000');
  });