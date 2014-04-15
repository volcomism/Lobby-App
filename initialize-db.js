var fs = require('fs');
var db = new (require('sqlite3')).Database('lobby.db');


db.exec(fs.readFileSync('create-tables.sql', 'utf-8'));

var stmt = db.prepare('INSERT INTO settings VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)');
stmt.run(60, 'ba01338ba5fa0c1584a6d41f93fe550b1d715a8de2da10d6c673131a85658394', 'ACME LLC', 'Springsfield', 'demo', 'lobby.app@gmail.com', 'LobbyApp1', '');
stmt.finalize();

oldFile = fs.createReadStream('default_logo.png');
newFile = fs.createWriteStream('public/images/logo.png');     
oldFile.pipe(newFile);

var stmt = db.prepare('INSERT INTO reasons VALUES (?, ?, ?, ?, ?, ?, ?)');
stmt.run(1, 'Business', 'b', 1, 'F75F9D49-2E7C-4EB8-9496-A9F7493798BF', 1, 0);
stmt.run(2, 'Interview', 'i', 0, 'F75F9D49-2E7C-4EB8-9496-A9F7493798BF', 1, 0);
stmt.run(3, 'Personal', 'p', 0, '---', 1, 0);
stmt.run(4, 'Temporary Badge', 't', 0, '---', 0, 1);
stmt.run(5, 'Delivery', 'd', 0, '---', 0, 0);
stmt.run(6, 'Building Personnel', 'u', 0, '---', 0, 0);
stmt.finalize();

