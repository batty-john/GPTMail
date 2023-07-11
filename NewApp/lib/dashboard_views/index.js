const express = require('express');

module.exports = function(session) {
  const app = express();

  app.use(session);

  app.set('views', __dirname);
  app.set('view engine', 'ejs');
  app.use(express.static(__dirname));



  /*********************************************
   * 
   * 
   * 
  ********************************************/
  app.get('/', (req, res) => {
    if (req.session.userId) {
      res.render('index');
    } else {
      res.redirect('/login');
    }
  });

  return app;
};