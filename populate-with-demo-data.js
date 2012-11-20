var moment = require('moment');
var csv = require('csv');
var db = new (require('sqlite3')).Database('lobby.db');


var stmt = db.prepare('INSERT INTO people VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
stmt.run(1, 'Mikey', 'Mike', 'Interview', null, null, 'mikey@example.org', 'sspecial@example.com', null, moment().valueOf(), null);
stmt.run(2, 'John', 'Peterson', 'Business', 'ACME, LLC', 'Developer', 'john@example.org', 'mikey@example.org', null, moment().subtract('hours', 2).valueOf(), null);
stmt.run(3, 'Joe', 'Schmoe', 'Personal', null, null, 'joe@example.org', 'mikey@example.org', null, moment().subtract('hours', 1).valueOf(), null);
stmt.run(4, 'Some', 'Dude', 'Business', 'Acme, Inc.', 'Sales Engineer', 'somedude@example.com', 'mikey@example.org', null, moment().subtract('days', 1).valueOf(), null);
stmt.run(5, 'Jane', 'Doe', 'Business', 'Acme, Inc.', 'Marketer', 'jane.doe@example.com', 'sspecial@example.com', null, moment().subtract('weeks', 1).valueOf(), null);
stmt.run(6, 'Jennifer', 'Smith', 'Temporary Badge', null, null, 'jennifer@example.com', '', 'IDQ284', moment().subtract('days', 3).valueOf(), null);
stmt.finalize();

var hostStmt = db.prepare('INSERT INTO hosts VALUES (?, ?)');
csv().from.path('hosts.csv')
.on('record', function(data, index) {
  hostStmt.run(data);
})
.on('end', function(count) {
  hostStmt.finalize();
});

