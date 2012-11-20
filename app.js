
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

var fs = require('fs');
var rest = require('restler');
var moment = require('moment');
var SqliteStore = require('./sqlite-store');
var db = require('./database');
var print = require('./print');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session(
    { store: new SqliteStore()
    , secret: 'LobbyApp'
  }));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.post('/check_signout', routes.check_signout);
app.get('/reason', routes.reason);
app.all('/flow', routes.flow);
app.get('/company', routes.company);
app.get('/email', routes.email);
app.get('/host', routes.host);
app.get('/badge', routes.badge);
app.post('/sign', routes.sign);
app.get('/return', routes.return);
app.get('/confirm_signin', routes.confirm_signin); // for selenium only
app.post('/confirm_signin', routes.confirm_signin);
app.get('/confirm_signout', routes.confirm_signout);

app.get('/timeout', function(req, res) {
  db.Setting.first(db.connection, function(err, setting) {
    if (err) throw err;

    res.send(setting.user_timeout.toString());
  });
});

app.post('/timeout', function(req, res) {
  db.Setting.first(db.connection, function(err, setting) {
    if (err) throw err;

    setting.user_timeout = req.param('user_timeout');
    setting.save(db.connection, function() {
      res.send();
    });
  });
});

app.get('/back', function(req, res) {
  if (req.session.user.previous_pages.length > 0) {
    req.session.user.flow.unshift(req.headers.referer);
    res.redirect(req.session.user.previous_pages.pop());
  } else {
    res.redirect('/');
  }
});

app.get('/validate_host', function(req, res) {
  db.Host.where({ name: req.param('host_name') }).count(db.connection, function(err, count) {
    if (err) throw err;

    res.send(count > 0);
  });
});

app.get('/admin', routes.admin_login);
app.all('/admin_menu', routes.admin_menu);
app.get('/admin_history', routes.admin_history);
app.get('/admin_settings', routes.admin_settings);
app.get('/admin_reasons', routes.admin_reasons);
app.get('/admin_hosts', routes.admin_hosts);

app.post('/admin_reasons_edit', function(req, res) {
  if (req.param('add')) {
    var new_reason = new db.Reason();
    new_reason.save(db.connection, function() {});
    res.send();
    return;
  }

  db.Reason.all(db.connection, function(err, reasons) {
    if (err) throw err;

    var row_id = parseInt(req.param('row_id'), 10);
    var reason = reasons.getById(row_id);

    if (req.param('delete')) {
      reason.delete(db.connection, function() {
        res.send();
      });
      return;
    }

    reason[req.param('column')] = req.param('value');
    reason.save(db.connection, function() {
      res.send(req.param('value'));
    });
  });
});

app.post('/admin_manual_signout', function(req, res) {
  db.Person.all(db.connection, function(err, people) {
    if (err) throw err;

    var row_id = parseInt(req.param('row_id'), 10);
    var person = people.getById(row_id);

    var now = moment();
    person.signout_time = now.valueOf();
    person.save(db.connection, function() {
      res.send(now.format('M/D/YYYY h:mm A'));
    });
  });
});

app.post('/admin_update_name', function(req, res) {
  db.Setting.first(db.connection, function(err, setting) {
    if (err) throw err;

    setting.company_name = req.param('new_name');
    setting.save(db.connection, function() {
      res.send();
    });
  });
});

app.post('/admin_update_location', function(req, res) {
  db.Setting.first(db.connection, function(err, setting) {
    if (err) throw err;

    setting.company_location = req.param('new_location');
    setting.save(db.connection, function() {
      res.send();
    });
  });
});

app.post('/admin_update_logo', function(req, res) {
  var path = 'public/images/logo.png';
  fs.unlinkSync(path); // remove old logo

  req.on('data', function(data) {
    var stream = fs.createWriteStream(path, {'flags': 'a'});
    stream.end(data);
  });
  req.on('end', function() {
    res.send();
  });
});

app.post('/admin_update_hosts', function(req, res) {
  var hosts = '';

  // import modules
  var sqlite3 = require('sqlite3');
  var db_raw = new sqlite3.Database('lobby.db');
  var csv = require('csv');

  db_raw.run('DELETE FROM hosts'); // clear old data

  req.on('data', function(data) {
    hosts += data;
  });
  req.on('end', function() {
    var hostStmt = db_raw.prepare('INSERT INTO hosts VALUES (?, ?)');
    csv()
      .from.string(hosts)
      .on('record', function(data, index) {
        hostStmt.run(data);
      })
      .on('end', function(count) {
        hostStmt.finalize(function() {
          res.send();
        });
      });
  });
});

app.post('/admin_update_env', function(req, res) {
  db.Setting.first(db.connection, function(err, setting) {
    if (err) throw err;

    setting.ds_env = req.param('ds_env');
    setting.save(db.connection, function() {
      res.send();
    });
  });
});

app.post('/admin_update_admin_password', function(req, res) {
  db.Setting.first(db.connection, function(err, setting) {
    if (err) throw err;

    setting.admin_password = req.param('admin_password');
    setting.save(db.connection, function() {
      res.send();
    });
  });
});

app.post('/docusign_test', function(req, res) {
  var env = req.param('env');
  var name = req.param('name');
  var password = req.param('password');
  var key = req.param('key');

  if (key === '')
    key = require('./default_integrator_key').ikey;

  // headers preparation
  var cred = '<DocuSignCredentials>' +
             '<Username>' + name + '</Username>' +
             '<Password>' + password + '</Password>' +
             '<IntegratorKey>' + key + '</IntegratorKey>' +
             '</DocuSignCredentials>';
  var headers = { headers:
    { "X-DocuSign-Authentication": cred
    , "content-type": "application/json"
    , "accept": "application/json"
  }};

  var url = 'https://' + env + '.docusign.net/restapi/v2/login_information';
  rest.get(url, headers).on('complete', function(result) {
    res.send(!('errorCode' in result)); // return true if valid account
  });
});

app.post('/docusign', function(req, res) {
  db.Setting.first(db.connection, function(err, setting) {
    if (err) throw err;

    setting.ds_env = req.param('env');
    setting.ds_account_name = req.param('name');
    setting.ds_account_password = req.param('password');
    setting.ds_account_key = req.param('key');
    setting.save(db.connection, function() {
      res.send();
    });
  });
});

app.get('/dsrest_init', function(req, res) {
  if (req.session.user.base_url != null) {
    // we already logged in, so no need to contact DS again
    res.send(false);
    return;
  }

  db.Setting.first(db.connection, function(err, setting) {
    if (err) throw err;

    // initialize headers that is constant for all API calls
    var ds_account_name = setting.ds_account_name;
    var ds_account_password = setting.ds_account_password;
    var ds_integrator_key = setting.ds_account_key;
    var ds_env = setting.ds_env;

    if (ds_integrator_key === '')
      ds_integrator_key = require('./default_integrator_key').ikey;

    var cred = '<DocuSignCredentials>' +
               '<Username>' + ds_account_name + '</Username>' +
               '<Password>' + ds_account_password + '</Password>' +
               '<IntegratorKey>' + ds_integrator_key + '</IntegratorKey>' +
               '</DocuSignCredentials>';
    req.session.user.rest_headers = { headers:
      { "X-DocuSign-Authentication": cred
      , "content-type": "application/json"
      , "accept": "application/json"
    }};

    req.session.user.login_url = 'https://' + ds_env + '.docusign.net/restapi/v2/login_information';


    // contact DS now
    var url = req.session.user.login_url;
    var headers = req.session.user.rest_headers;

    print._('request: ' + url + '\n  ' + JSON.stringify(headers));
    rest.get(url, headers).on('complete', function(result) {
      print._('response: ' + '\n  ' + JSON.stringify(result));

      if ('loginAccounts' in result)
        req.session.user.base_url = result['loginAccounts'][0]['baseUrl'];

      res.send('errorCode' in result);
    });
  });
});

app.get('/dsrest_create_envelope', function(req, res) {
  var name = req.session.user.first_name + ' ' + req.session.user.last_name;
  var email = req.session.user.email;
  var template = req.session.user.template_guid;
  var headers = req.session.user.rest_headers;
  var url = req.session.user.base_url + '/envelopes';

  var data = {
    "templateId": template,
    "templateRoles": [
      { "email": email
      , "name": name
      , "roleName": "Signer"
      , "clientUserId": "1"
      }
    ], "status": "sent"
  };
  print._('request: ' + url + '\n  ' + JSON.stringify(data));

  rest.postJson(url, data, headers).on('complete', function(result) {
    print._('response: ' + '\n  ' + JSON.stringify(result));

    if ('uri' in result)
      req.session.user.view_url = req.session.user.base_url +
                                  result['uri'] + '/views/recipient';

    res.send('errorCode' in result);
  });
});

app.get('/dsrest_iframe_url', function(req, res) {
  var name = req.session.user.first_name + ' ' + req.session.user.last_name;
  var email = req.session.user.email;
  var headers = req.session.user.rest_headers;
  var exit = 'http://' + req.headers.host + '/return';
  var url = req.session.user.view_url;

  var data =
    { "authenticationMethod": "email"
    , "email": email
    , "returnUrl": exit
    , "userName": name
    , "clientUserId": "1"
  };
  print._('request: ' + url + '\n  ' + JSON.stringify(data));

  rest.postJson(url, data, headers).on('complete', function(result) {
    print._('response: ' + '\n  ' + JSON.stringify(result));
    res.send(result);
  });
});

app.get('/dsrest_send_notification', function(req, res) {
  var guest_name = req.session.user.first_name + ' ' + req.session.user.last_name;
  var host_name = req.query.host_name;

  db.Host.where('name = ?' , host_name).first(db.connection, function(err, host) {
    if (err) throw err;

    var url = req.session.user.base_url + '/envelopes';
    var data =
      { 'emailSubject': ('Your guest, ' + guest_name + ', has arrived.')
      , 'documents': [
          { 'documentId': '1'
          , 'name': 'Host Notification'
        }]
      , 'recipients': { 'certifiedDeliveries': [
          { 'email': host.email
          , 'name': host.name
          , 'recipientId': '123'
          , 'routingOrder': '1'
        }]}
      , 'status': 'sent'
    };

    var time = moment();
    var content = 'Your guest, ' + guest_name + ', has arrived on ' + time.format('MMMM D, YYYY') + ' at ' + time.format('h:mm A') + '.';

    var form_data = '\n--myBoundary\nContent-Type: application/json\nContent-Disposition: form-data\n\n' + JSON.stringify(data) + '\n--myBoundary\nContent-Type:text/plain\nContent-Disposition: file; filename=”Host Notification"; documentid=1\n\n' + content + '\n--myBoundary--\n';
    var form_headers =
      { "X-DocuSign-Authentication": req.session.user.rest_headers.headers['X-DocuSign-Authentication']
      , "content-type": "multipart/form-data; boundary=myBoundary"
      , "content-length": form_data.length
    };

    var options =
      { headers: form_headers
      , data: form_data
    };
    print._('request: ' + url + '\n  ' + JSON.stringify(data));

    rest.post(url, options).on('complete', function(result) {
      print._('response: ' + '\n  ' + JSON.stringify(result));
      res.send('errorCode' in result);
    });
  });
});

http.createServer(app).listen(app.get('port'), function(){
  print._("Express server listening on port " + app.get('port'));
});

