var Imap = require('imap'),
    MailParser = require('mailparser').MailParser,
    fs = require('fs'),
    inspect = require('util').inspect;

var imap = new Imap({
  user: 'morgan.thacker@ducimus.digital',
  password: '0$v(mZD+T#_^',
  host: 'atlas.ducimus.digital',
  port: 993,
  tls: true
});

function openInbox(cb) {
  imap.openBox('INBOX', true, cb);
}

imap.once('ready', function() {
  openInbox(function(err, box) {
    if (err) throw err;
    var f = imap.seq.fetch('1:3', {
      bodies: '',
      struct: true
    });

    f.on('message', function(msg, seqno) {
      var parser = new MailParser();

      parser.on('headers', function(headers) {
        console.log('Header data: %s', inspect(headers));
        const subject = headers.get('subject');
        const sender = headers.get('from').text;
        const recipients = headers.get('to').text;
        const date = new Date(headers.get('date')); // Convert to Date object for easier handling

        parser.on('data', function(data) {
          if (data.type === 'text') {
            console.log(seqno);
            console.log(inspect(data.text));
            const body = inspect(data.text);
            const textPreview = body.substring(0,100); // Adjust this value as per your needs

            let jsonOutput = {
              seqno: seqno,
              subject: subject,
              sender: sender,
              recipients: recipients,
              date: date.toISOString(),
              time: date.getTime(),
              body: body,
              textPreview: textPreview,
            }
            fs.writeFileSync(`mail${seqno}.json`, JSON.stringify(jsonOutput));
          }
        });
      });

      msg.on('body', function(stream, info) {
        stream.pipe(parser);
      });
    });

    f.once('error', function(err) {
      console.log('Fetch error: ' + err);
    });

    f.once('end', function() {
      console.log('Done fetching all messages!');
      imap.end();
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