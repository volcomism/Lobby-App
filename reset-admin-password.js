// run this if the admin password needs to be reset

var db = new (require('sqlite3')).Database('lobby.db');

db.run("UPDATE settings SET admin_password = 'fcf730b6d95236ecd3c9fc2d92d7b6b2bb061514961aec041d6c7a7192f592e4' WHERE id = 1");

