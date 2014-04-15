if (process.env['LOBBY_APP_QUIET'])
  exports._ = function() {};
else
  exports._ = console.log;
