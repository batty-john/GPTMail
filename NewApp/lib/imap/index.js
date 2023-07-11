const express = require('express');
const bodyParser = require('body-parser');

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


/*********************************************
 * 
 * 
 * 
 *******************************************/


  /*********************************************
 * 
 * 
 * 
 *******************************************/
  
return app;
};