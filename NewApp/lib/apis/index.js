const express = require('express');
const bodyParser = require('body-parser');
const { now } = require('lodash');

module.exports = function(db, session) {
const app = express();
app.use(session);


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))


/*********************************************
 * 
 * 
 * 
 *******************************************/
app.get('/getEmails/:accountId', async (req, res) => {
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
  
    // // TODO: If there are no emails for this account, fetch them
    // if (emails.length === 0) {
    //   try {
    //     await getAllMailHeaders(accountId, userId, db);
    //     // Fetch the emails again after getting them
    //     [emails] = await db.query('SELECT * FROM emails WHERE account_id = ?', [accountId]);
    //   } catch (error) {
    //     console.error('Failed to fetch mail headers:', error);
    //     return res.status(500).send('Failed to fetch mail headers');
    //   }
    // }
  
    // Send the emails to the client
    res.json(emails);
  });
 
 /*********************************************
 * 
 * 
 * 
 *******************************************/
 app.get('/getUserMail/:accountId', async (req, res) => {
    res.redirect(`/getEmails/${accountId}`);
  });

/*********************************************
 * 
 * 
 * 
 *******************************************/
app.get('/getEmail/:accountId/:uid', async (req, res) => { 


});

/*********************************************
 * 
 * 
 * 
 *******************************************/
app.get('/getFolders/:accountId/', async (req, res) => { 


  if (!req.session.userId) {
    return res.status(401).send('Please log in to continue');
  }
  
  const accountId = req.params.accountId;
  const userId = req.session.userId;
 

  const [accounts] = await db.query('SELECT * FROM user_accounts WHERE id = ?', [accountId]);
  const account = accounts[0]
  if (account.user_id !== userId) {
    return res.status(403).send('Not authorized to access this account');
  }
  
 
  const query = 'SELECT * FROM folders WHERE accountid = ?';
  


  let [folders] = await db.query (query, accountId);
  res.json(folders);

});

/*********************************************
 * 
 * 
 * 
 *******************************************/
app.get('/getFolderEmails/:accountId/:folderId', async (req, res) => { 

  

  const accountId = req.params.accountId;
  var folderId = req.params.folderId;
  
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

  if(folderId === 'inbox') {

    console.log('Inbox');
   
    let [emails] = await db.query('SELECT * FROM emails WHERE account_id = ? AND folder_id IS NULL', [accountId]);
    res.json(emails);

  }
  else {
    
    if(folderId === 'sent') {
    let [folders] = await db.query('SELECT folderid FROM folders WHERE accountid = ? AND foldername = ?', [accountId, 'sent']);
    folderId = folders[0].folderid;
    }
    else if(folderId === 'drafts') {
      let [folders] = await db.query('SELECT folderid FROM folders WHERE accountid = ? AND foldername = ?', [accountId, 'drafts']);
      folderId = folders[0].folderid;
    }
    else if(folderId === 'trash') {
      let [folders] = await db.query('SELECT folderid FROM folders WHERE accountid = ? AND foldername = ?', [accountId, 'trash']);
      folderId = folders[0].folderid;
    }

  // Fetch the emails
  let [emails] = await db.query('SELECT * FROM emails WHERE account_id = ? AND folder_id = ?', [accountId, folderId]);

  res.json(emails);
  }
  
});

  /*********************************************
 * 
 * 
 * 
 *******************************************/
  app.get('/deleteEmail/:accountId/:uid', async (req, res) => {

    const accountId = req.params.accountId;
    const uid = req.params.uid;
  
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
    
    // Delete the email
    let [trashFolders] = await db.query('SELECT folderid FROM folders WHERE accountid = ? AND foldername = ?', [accountId, 'Trash']);
    console.log(trashFolders);
    let trashFolder = trashFolders[0];
    console.log(trashFolder);

    console.log(`UPDATE emails SET folder_id = ${trashFolder.folderid} WHERE account_id = ${accountId} AND UID = ${uid}`)
    await db.query('UPDATE emails SET folder_id = ? WHERE account_id = ? AND UID = ?', [trashFolder.folderid, accountId, uid]);

    res.json(`Deleted email ${req.params.uid}`);
  
});

/*********************************************
 * 
 * 
 * *******************************************/
app.post('/deleteEmails/:accountId', async (req, res) => { 

  
});

/*********************************************
 * 
 * 
 * 
 *******************************************/
app.get('/addFolder/:accountID/:folderName', async (req, res) => { 

  if (!req.session.userId) {
    return res.status(401).send('Please log in to add a Folder');
  }

  const folderName = req.params.folderName;
  const accountID = req.params.accountID;

  const query = 'INSERT INTO folders (folderName, accountid) VALUES (?,?)';
  console.log(`INSERT INTO folders (folderName, accountid) VALUES (${folderName},${accountID})`);
  

  try {
    
    await db.query (query, [folderName, accountID]);
    res.status(200);
  }
  catch (err) {
    res.status(500).send('Error adding label: ' + err.message);
  }
});


/*********************************************
 * 
 * 
 * 
 *******************************************/
app.get('/moveToFolder/:uid/:folderID', async (req, res) => { 

  const folderID = req.params.folderID;
  const uid = req.params.uid;

  // Check if the user is logged in and the accountId belongs to them
  const userId = req.session.userId;
  if (!userId) {
    return res.status(401).send('Not logged in');
  }

  const [folders] = await db.query('SELECT * FROM folders WHERE id = ?', [folderID]);
  const folder = folders[0]

  const accountId = folder.accountId;

  const [accounts] = await db.query('SELECT * FROM user_accounts WHERE id = ?', [accountId]);
  const account = accounts[0]
  if (account.user_id !== userId) {
    return res.status(403).send('Not authorized to access this account');
  }

  await db.query('UPDATE emails SET folder_id = ? WHERE account_id = ? AND UID = ?', [folderid, accountId, uid]);

});

/*********************************************
 * 
 * 
 * 
 *******************************************/
app.get('/removeFromFolder/:uid/:folderID', async (req, res) => { 


});

/*********************************************
 * Set the flag for an email
 * 
 * 
 *******************************************/
app.get('/setImportant/:uid', async (req, res) => { 


});

/*********************************************
 * 
 * 
 * 
 *******************************************/
app.get('/setPriority/:uid/:priority', async (req, res) => { 


});

/*********************************************
 * 
 * 
 * 
 *******************************************/
app.post('/sendEmail/', async (req, res) => { 
  console.log(req.body);
  res.json(`Sent email`);
  const query = 'INSERT INTO emails (account_id, sender, recipients, subject, date, cc_recipients, bcc_recipients, folder_Id) VALUES (?, SELECT email FROM user_accounts WHERE id = ?, ?, ?, ?, ?, ?, SELECT folderID FROM folders WHERE folderName = Sent AND accountId = ?)'
});

/*********************************************
 * 
 * 
 * 
 *******************************************/
app.get('/getAccounts/:uid', async (req, res) => { 


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
app.get('/getAccounts', async (req, res) => {
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
app.post('/search//:accountID', async (req, res) => { 


});

/*********************************************
 * 
 * 
 * 
 *******************************************/
app.post('/saveDraft/:accountID', async (req, res) => { 

  let accountId = req.params.accountID;

   //get drafts folder id
   let [folders] = await db.query('SELECT folderID FROM folders WHERE accountId = ? AND folderName = ?', [accountId, 'Drafts']);
   let draftsFolderId = folders[0].folderID;
   console.log(req.body);
   let date = new Date();
   let thread_id = 0;
   db.query('INSERT INTO emails (account_id, subject, sender, recipients, date, cc_recipients, bcc_recipients, folder_id, thread_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [accountId, req.body.subject, req.body.from, req.body.to, date, req.body.cc_recipients, req.body.bcc_recipients, draftsFolderId, thread_id]);
   res.send('Draft saved');


});

/*********************************************
 * 
 * 
 * 
 *******************************************/
app.post('/loadDraft/:accountID/:emailID', async (req, res) => { 
  let accountId = req.params.accountID;
  let emailID = req.params.emailID;
  let userId = req.session.userId;

  //check if user is logged in
  if (!userId) {
    return res.status(401).send('Please log in to continue');
  }

  //check if account belongs to user
  let [accounts] = await db.query('SELECT * FROM user_accounts WHERE id = ?', [accountId]);
  let account = accounts[0];
  if (account.user_id !== userId) {
    return res.status(403).send('Not authorized to access this account');
  }

  //get email
  let [emails] = await db.query('SELECT * FROM emails WHERE account_id = ? AND id = ?', [accountId, emailID]);
  let email = emails[0];

  res.json(email);

});

/*********************************************
 * 
 * 
 * 
 *******************************************/
app.get('/getSentEmails/:accountID', async (req, res) => { 


});

/*********************************************
 * 
 * 
 * 
 *******************************************/
app.get('/getDrafts/:accountID', async (req, res) => { 


});

/*********************************************
 * 
 * 
 * 
 *******************************************/
app.get('/getLabels', async (req, res) => {


  if (!req.session.userId) {
    return res.status(401).send('Please log in to add an account');
  }
  const query = 'SELECT * FROM labels WHERE userId = ?';
  const userId = req.session.userId;


  let [labels] = await db.query (query, userId);
  res.json(labels);
});

/*********************************************
 * 
 * 
 * 
 *******************************************/
app.get('/addLabel/:label_name', async (req, res) => {

  if (!req.session.userId) {
    return res.status(401).send('Please log in to add a label');
  }

  const query = 'INSERT INTO labels (label_name, userId, color) VALUES (?,?,?)';
  const userId = req.session.userId;
  const color = "#ffffff";
  const labelName = req.params.label_name;

  try {
    
    await db.query (query, [labelName, userId, color]);
    res.status(200);
  }
  catch (err) {
    res.status(500).send('Error adding label: ' + err.message);
  }
});

return app;
};

