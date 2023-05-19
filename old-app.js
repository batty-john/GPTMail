const express = require('express');
const http = require('http');
const imaps = require('imap-simple');
const path = require('path');
const mailparser = require('mailparser').simpleParser;

const app = express();
const server = http.createServer(app);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public'));

let newMail = [];

const config = {
    imap: {
        user: "morgan.thacker@ducimus.digital",
        password: "0$v(mZD+T#_^",
        host: "atlas.ducimus.digital",
        port: 993,
        tls: true,
        authTimeout: 3000
    }
};

imaps.connect(config).then(function(connection) {
  return connection.openBox('INBOX').then(function() {
      var searchCriteria = ['ALL'];
      var fetchOptions = {
          bodies: ['HEADER', 'TEXT'],
          struct: true,
          markSeen: false
      };
      return connection.search(searchCriteria, fetchOptions);
  }).then(function(messages) {
      const promises = messages.map(function(message) {
          if (message.attributes.struct) { // check if struct is defined
              const allParts = imaps.getParts(message.attributes.struct);
              const part = allParts.find(part => part.which === "TEXT");
              return connection.getPartData(message, part)
                  .then(function(partData) {
                      return mailparser(partData);
                  });
          } else {
              // If struct is not defined, we return a resolved Promise
              // with some placeholder object
              return Promise.resolve({subject: "No Subject", text: "No Text"});
          }
      });

      return Promise.all(promises);
  }).then(function(emails) {
      emails.forEach(function(email) {
          console.log(email);
          newMail.push(email);
      });
  });
});

app.get('/', (req, res) => {
    res.render('index.ejs', {mail: newMail});
});

server.listen(3000, () => console.log('Server listening on port 3000'));

 