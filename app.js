const express = require('express');
const http = require('http');
const notifier = require('mail-notifier');
const path = require('path');
const mysql = require('mysql2');

const app = express();

app.set('view engine', 'ejs');
app.set('public', path.join(__dirname, 'public'));

let newMail = new Array();


const server = http.createServer(app);
//app.use(express.static('public'));

app.get('/', (req, res) => {
    var examplemail = "this" + " is " + "a " +  "test email";
    res.render('index.ejs', {mail:newMail});
});

const imap = {
    user: "morgan.thacker@ducimus.digital",
    password: "0$v(mZD+T#_^",
    host: "mail.ducimus.digital",
    port: 993, // imap port
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  };
  
  notifier(imap)
    .on('mail', mail => console.log(mail))
    .on('error', err => console.log(err))
    .start();

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

 