var Store = require('express/node_modules/connect/lib/middleware/session/store');
var db = require('./database.js');

/**
* Initialize a new `SqliteStore`.
*
* @api public
*/

var SqliteStore = module.exports = function SqliteStore() {
};

/**
* Inherit from `Store.prototype`.
*/

SqliteStore.prototype.__proto__ = Store.prototype;

/**
* Attempt to fetch session by the given `sid`.
*
* @param {String} sid
* @param {Function} fn
* @api public
*/

SqliteStore.prototype.get = function(sid, fn){
  var self = this;
  process.nextTick(function(){
    var expires;

    db.Session.where({ sid: sid }).count(db.connection, function(err, count) {
      if (err) throw err;

      if (count == 0) {
        fn();
      } else {
        db.Session.where({ sid: sid }).all(db.connection, function(err, sessions) {
          if (err) throw err;

            var sess = sessions[0].data;
            sess = JSON.parse(sess);

            expires = 'string' == typeof sess.cookie.expires
              ? new Date(sess.cookie.expires)
              : sess.cookie.expires;
            if (!expires || new Date < expires) {
              fn(null, sess);
            } else {
              self.destroy(sid, fn);
            }
        });
      }
    });
  });
};

/**
* Commit the given `sess` object associated with the given `sid`.
*
* @param {String} sid
* @param {Session} sess
* @param {Function} fn
* @api public
*/

SqliteStore.prototype.set = function(sid, sess, fn){
  process.nextTick(function(){
    db.Session.where({ sid: sid }).count(db.connection, function(err, count) {
      if (err) throw err;
      var session;

      if (count == 0) {
        session = new db.Session(
          { sid: sid
          , data: JSON.stringify(sess)
        });
        session.save(db.connection, function() {
          fn && fn();
        });
      } else {
        db.Session.where({ sid: sid }).all(db.connection, function(err, sessions) {
          if (err) throw err;

          session = sessions[0];
          session.data = JSON.stringify(sess);

          session.save(db.connection, function() {
            fn && fn();
          });
        });
      }
    });
  });
};

/**
* Destroy the session associated with the given `sid`.
*
* @param {String} sid
* @api public
*/

SqliteStore.prototype.destroy = function(sid, fn){
  process.nextTick(function(){
    db.Session.where({ sid: sid }).first(db.connection, function(err, session) {
      if (err) throw err;

      if (session == null) {
        fn && fn();
        return;
      }

      session.delete(db.connection, function() {
        fn && fn();
      });
    });
  });
};

