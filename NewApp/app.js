const express = require('express');
const mysql = require('mysql2/promise');
const session = require('express-session');
const app = express();
const port = 3000;


async function startApp() {
    // Database connection
    const db = await mysql.createPool({
        host: 'outlawslosttreasure.com',
        user: 'ducimus_gptmailer',
        password: 'nP5UEjY=%$W1',
        database: 'ducimus_gptmail',
    }).getConnection();
    console.log('Connected to database');

    const ses = session({
        secret: 'Frog Eye Salad AND Third Eye Sam',  // you should use a unique string for the secret
        resave: false,  // forces the session to be saved back to the session store, even if the session was never modified during the request
        saveUninitialized: true,  // forces a session that is "uninitialized" to be saved to the store. Choosing false is useful for implementing login sessions, reducing server storage usage, or complying with laws that require permission before setting a cookie.
        cookie: { secure: false } // if you are using https use { secure: true }
      });

    const login = require('./lib/login/index.js')(db, ses);
    app.use(login);

    const imap = require('./lib/imap/index.js')(db, ses);
    app.use(imap);

    const apis = require('./lib/apis/index.js')(db, ses);
    app.use(apis);

    const views = require('./lib/dashboard_views/index.js')(ses);
    app.use(views);

    app.use(express.static('public'));


    app.listen(port);
    console.log(`Server listening at http://localhost:${port}`);
}

startApp().catch(err => {
    console.error('Failed to start app:', err);
    process.exit(1);  // Exit the process with a failure code
});
