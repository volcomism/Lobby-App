var rest = require('restler');
var moment = require('moment');
var db = require('../database');
var print = require('../print');

var total_pages = 6;

exports.index = function(req, res) {
  req.session.user = {};

  db.Setting.first(db.connection, function(err, setting) {
    res.render('user/index',
      { title: 'Lobby App'
      , style: 'style'
      , page_number: 1
      , total_pages: total_pages
      , company_name: setting.company_name
      , company_location: setting.company_location
    });
  });
};

exports.check_signout = function(req, res) {
  req.session.user.first_name = req.param('first_name');
  req.session.user.last_name = req.param('last_name');

  db.Person.where(
    'first_name = ? COLLATE NOCASE AND last_name = ? COLLATE NOCASE AND signout_time IS NULL',
    [req.session.user.first_name, req.session.user.last_name]
  ).orderBy('signin_time', db.Descending).all(db.connection, function(err, people) {
    if (err) throw err;

    if (people.length > 0) {
      req.session.user.person = people[0];
      res.render('user/check_signout',
        { title: 'Sign Out?'
        , style: 'style'
        , first_name: req.session.user.first_name
        , last_name: req.session.user.last_name
        , signin_time: moment(req.session.user.person.signin_time).format('h:mm A on MMMM D, YYYY')
      });
    } else {
      res.redirect('reason');
    }
  });
};

exports.confirm_signout = function(req, res) {
  db.Person.getById(db.connection, req.session.user.person.id, function(err, person) {
    person.signout_time = moment().valueOf();
    person.save(db.connection, function() {
      res.render('user/confirm_signout',
        { title: 'Sign-out Confirmation'
        , style: 'style'
        , first_name: req.session.user.first_name
        , last_name: req.session.user.last_name
      });
    });
  });
};

exports.reason = function(req, res) {
  req.session.user.is_first_time = true;
  req.session.user.flow = [];
  req.session.user.previous_pages = ['/'];

  db.Reason.all(db.connection, function(err, rows) {
    if (err) throw err;

    var reasons = [];
    var access_keys = [];
    rows.forEach(function(row) {
      reasons.push(row.reason);
      access_keys.push(row.access_key);
    });

    res.render('user/reason',
      { title: 'Reason to Visit'
      , style: 'style'
      , page_number: 2
      , total_pages: total_pages
      , reasons: reasons
      , access_keys: JSON.stringify(access_keys)
    });
  });
};

exports.flow = function(req, res) {
  for (key in req.body) {
    req.session.user[key] = req.body[key];
  }

  if (req.session.user.is_first_time) { // first time going into the flow
    req.session.user.is_first_time = false;

    db.Reason.where({ reason: req.session.user.visit_reason }).first(db.connection, function(err, reason) {
      if (err) throw err;

      if (reason.show_company == 1)
        req.session.user.flow.push('/company');

      // get DS template ID
      var re = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/; // GUID format
      if (re.exec(reason.template_guid)) { // is the GUID valid?
        req.session.user.template_guid = reason.template_guid;
        req.session.user.flow.push('/email');
      }

      if (reason.show_host == 1)
        req.session.user.flow.push('/host');

      if (reason.show_badge == 1)
        req.session.user.flow.push('/badge');

      req.session.user.flow.push('/confirm_signin');

      req.session.user.previous_pages.push('/reason');
      res.redirect(req.session.user.flow.shift());

    });
  } else {
    // in the middle of the flow
    var prev_page = req.query.flow_previous ? req.query.flow_previous : req.headers.referer;
    req.session.user.previous_pages.push(prev_page);
    res.redirect(req.session.user.flow.shift());
  }
};

exports.company = function(req, res) {
  res.render('user/company',
    { title: 'Business'
    , style: 'style'
    , page_number: 3
    , total_pages: total_pages
  });
};

exports.email = function(req, res) {
  res.render('user/email',
    { title: 'Email Address'
    , style: 'style'
    , page_number: 4
    , total_pages: total_pages
  });
};

exports.sign = function(req, res) {
  req.session.user.email = (req.body.email.trim() == '') ? 'noreply@example.com' : req.body.email;

  res.render('user/sign',
    { title: 'Sign Document'
    , style: 'style'
  });
};

exports.return = function(req, res) {
  var url = '/';

  if (req.param('event') === 'signing_complete' ||
      req.param('event') === 'decline')
    url = '/flow?flow_previous=/email';

  res.render('user/return',
    { url: url
  });
};

exports.host = function(req, res) {
  db.Host.all(db.connection, function(err, rows) {
    if (err) throw err;

    var hosts = {};
    rows.forEach(function(row) {
      var name = row.name;
      hosts[name] = row.email;
    });

    res.render('user/host',
      { title: 'Host'
      , style: 'style'
      , page_number: 5
      , total_pages: total_pages
      , hosts: JSON.stringify(Object.keys(hosts))
    });
  });
};

exports.badge = function(req, res) {
  res.render('user/badge',
    { title: 'Badge'
    , style: 'style'
    , page_number: 3
    , total_pages: total_pages
  });
};

exports.confirm_signin = function(req, res) {
  db.Host.where({ name: req.session.user.host_name }).first(db.connection, function(err, host) {
    var host_email = (host != null) ? host.email : '';

    var person = new db.Person(
      { first_name: req.session.user.first_name
      , last_name: req.session.user.last_name
      , visit_reason: req.session.user.visit_reason
      , company_name: req.session.user.company_name
      , job_title: req.session.user.job_title
      , email: req.session.user.email
      , host: host_email
      , badge_number: req.session.user.badge_number
      , signin_time: moment().valueOf()
    });

    person.save(db.connection, function() {
      res.render('user/confirm_signin',
        { title: 'Sign-in Confirmation'
        , style: 'style'
        , page_number: 6
        , total_pages: total_pages
        , guest_firstname: person.first_name
        , guest_lastname: person.last_name
        , host_name: ((host != null) ? host.name : '')
      });
    });
  });
};

exports.admin_login = function(req, res) {
  if (!req.session.is_admin) {
    res.render('admin/login',
      { title: 'Admin Login'
      , style: 'admin'
    });
  } else {
    res.redirect('/admin_menu');
  }
};

exports.admin_menu = function(req, res) {
  db.Setting.first(db.connection, function(err, setting) {
    if (err) throw err;

    if (setting.admin_password == req.param('password') || req.session.is_admin) {
      req.session.is_admin = true;

      res.render('admin/menu',
        { title: 'Admin Menu'
        , style: 'admin'
      });
    } else {
      res.redirect('admin');
    }
  });
};

exports.admin_history = function(req, res){
  if (req.session.is_admin) { 

    var startTime;
    if (req.param('time')) {
      // only view history for a particular day
      startTime = moment(req.param('time'), 'MM/DD/YYYY');
    } else {
      startTime = moment().startOf('day');
    }

    db.Host.all(db.connection, function(err, rows) {
      var hosts = {};
      rows.forEach(function(row) {
        hosts[row.email] = row.name;
      });

      db.Person.where('signin_time > ? AND signin_time < ?',
        [startTime.valueOf(), moment(startTime).endOf('day').valueOf()]
      ).all(db.connection, function(err, rows) {
        if (err) throw err;

        var people = [];
        rows.forEach(function(row) {
          if (row.signout_time) {
            var signout_time = moment(row.signout_time).format('M/D/YYYY h:mm A');
          }

          people.push(
            [ row.id
            , row.first_name
            , row.last_name
            , row.visit_reason
            , row.email
            , row.company_name
            , row.job_title
            , hosts[row.host]
            , row.badge_number
            , moment(row.signin_time).format('M/D/YYYY h:mm A')
            , signout_time
          ]);
        });

        res.render('admin/history',
          { title: 'Visitor History'
          , style: 'admin'
          , people: JSON.stringify(people)
          , date: JSON.stringify(startTime.format('dddd, MMMM D, YYYY'))
        });
      });
    });

  } else {
    res.redirect('admin');
  }
};

exports.admin_settings = function(req, res){
  if (req.session.is_admin) { 
    db.Setting.first(db.connection, function(err, setting) {
      if (err) throw err;

      var key = setting.ds_account_key;
      if (key === '')
        key = require('../default_integrator_key').ikey;

      res.render('admin/settings',
        { title: 'Lobby App Settings'
        , style: 'admin'
        , companyName: setting.company_name
        , companyLocation: setting.company_location
        , ds_env: setting.ds_env
        , ds_account_name: setting.ds_account_name
        , ds_account_password: setting.ds_account_password
        , ds_integrator_key: key
        , admin_password: setting.admin_password
      });
    });
  } else {
     res.redirect('admin');
  }
};

exports.admin_reasons = function(req, res){
  if (req.session.is_admin) { 
    db.Reason.all(db.connection, function(err, rows) {
      if (err) throw err;

      var reasons = [];
      rows.forEach(function(row) {
        reasons.push(
          [ row.id
          , row.reason
          , row.access_key
          , row.show_company
          , row.template_guid
          , row.show_host
          , row.show_badge
        ]);
      });

      res.render('admin/reasons',
        { title: 'List of Visit Reasons'
        , style: 'admin'
        , reasons: JSON.stringify(reasons)
      });
    });
  } else {
     res.redirect('admin');
  }
};

exports.admin_hosts = function(req, res){
  if (req.session.is_admin) { 
    db.Host.all(db.connection, function(err, rows) {
      if (err) throw err;

      var hosts = [];
      rows.forEach(function(row) {
        hosts.push(
          [ row.email
          , row.name
        ]);
      });

      res.render('admin/hosts',
        { title: 'List of Hosts'
        , style: 'admin'
        , hosts: JSON.stringify(hosts)
      });
    });
  } else {
     res.redirect('admin');
  }
};
