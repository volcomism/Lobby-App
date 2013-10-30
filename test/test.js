/**
 * @copyright Copyright (C) DocuSign, Inc.  All rights reserved.
 *
 * This source code is intended only as a supplement to DocuSign SDK
 * and/or on-line documentation.
 * 
 * This sample is designed to demonstrate DocuSign features and is not intended
 * for production use. Code and policy for a production application must be
 * developed to meet the specific data and security requirements of the
 * application.
 *
 * THIS CODE AND INFORMATION ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY
 * KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
 * PARTICULAR PURPOSE.
 */

var assert = require('should');
var routes = process.env['LOBBY_APP_COV'] ? require('../routes-cov') : require('../routes');

describe('routes:', function() {

  describe('index()', function() {
    it("should provide a title and the index view name", function(done) {
      routes.index({ session: {} }, { render: function (viewName, params) {
        viewName.should.equal("user/index");
        params.title.should.equal('Lobby App');
        done();
      }})
    })
  })
  
  describe('check_signout()', function() {
    it("should provide a title and the check_signout view name", function(done) {
      routes.check_signout({
        session: { user: {} },
        param: function() {}
      }, {
        render: function (viewName, params) {
          viewName.should.equal("user/check_signout");
          params.title.should.equal('Sign Out?');
          done();
        },
        redirect: function(location){
          location.should.equal("reason");
          done();
        }
      })
    })
  })
  
  describe('confirm_signout()', function() {
    it("should provide a title and the confirm_signout view name", function(done) {
      routes.confirm_signout({
        session: { user: { person: { id: 1 } } }
      }, {
        render: function (viewName, params) {
          viewName.should.equal("user/confirm_signout");
          params.title.should.equal('Sign-out Confirmation');
          done();
        }
      })
    })
  })    
  
  describe('reason()', function() {
    it("should provide a title and the reason view name", function(done) {
      routes.reason({
        session: { user: {} }
      }, {
        render: function (viewName, params) {
          viewName.should.equal("user/reason");
          params.title.should.equal('Reason to Visit');
          done();
        }
      })
    })
  })
  
  describe('flow()', function() {
    it("should test that the flow works", function(done) {
      routes.flow({
        headers: {},
        body: [],
        session: { user:
          { visit_reason: 'Personal'
          , template_guid: ''
          , previous_pages: []
          , flow: []
          , is_first_time: true
        }}}, {
        redirect: function (location) {
          assert(location == '/host');
          done();
        }
      })
    })
  })
  
  describe('company()', function() {
    it("should provide a title and the company view name", function(done) {
      routes.company({}, {
        render: function (viewName, params) {
          viewName.should.equal("user/company");
          params.title.should.equal('Business');
          done();
        }
      })
    })
  })    
  
  describe('email()', function() {
    it("should provide a title and the email view name", function(done) {
      routes.email({}, {
        render: function (viewName, params) {
          viewName.should.equal("user/email");
          params.title.should.equal('Email Address');
          done();
        }
      })
    })
  })      

  describe('sign()', function() {
    it("should provide a title and the sign view name", function(done) {
      // give connecting to DS 10 seconds max
      this.timeout(10000);

      routes.sign({
        headers: {},
        body: { email: '' },
        session: { user: { template_guid: 'E3603967-4D78-4303-8A4D-6364CE08A522' } },
        param: function() {}      
      }, {
        render: function (viewName, params) {
          viewName.should.equal("user/sign");
          params.title.should.equal('Sign Document');
          done();
        }
      })
    })
  })  
  
  describe('return()', function() {
    it("should provide a title", function(done) {
      routes.return({
        param: function() {}      
      }, {
        render: function (viewName) {
          viewName.should.equal("user/return");
          done();
        }
      })
    })
  })    

  describe('host()', function() {
    it("should provide a title and the host view name", function(done) {
      routes.host({}, {
        render: function (viewName, params) {
          viewName.should.equal("user/host");
          params.title.should.equal("Host");
          done();
        }
      })
    })
  })  

  describe('badge()', function() {
    it("should provide a title and the badge view name", function(done) {
      routes.badge({}, {
        render: function (viewName, params) {
          viewName.should.equal("user/badge");
          params.title.should.equal("Badge");
          done();
        }
      })
    })
  })

  describe('confirm_signin() - host provided', function() {
    it("should provide a title and the confirm_signin view name", function(done) {
      this.timeout(10000);

      routes.confirm_signin({
        session: { user:
          { host_name: 'Mikey Mike'
        }}
      }, {
        render: function (viewName, params) {
          viewName.should.equal("user/confirm_signin");
          params.title.should.equal("Sign-in Confirmation");
          done();
        }
      })
    })
  })  
  
  describe('admin_login()', function() {
    it("should provide a title and the admin_login view name", function(done) {
      routes.admin_login({
        session: {}
      }, {
        render: function (viewName, params) {
          viewName.should.equal("admin/login");
          params.title.should.equal("Admin Login");
          done();
        },
        redirect: function (location) {
          location.should.equal("/admin_menu");
          done();        
        }
      })
    })
  })
  
  describe('admin_menu()', function() {
    it("should provide a title and the admin_menu view name", function(done) {
      routes.admin_menu({
        session: { is_admin: true },
        param: function() {}
      }, {
        render: function (viewName, params) {
          viewName.should.equal("admin/menu");
          params.title.should.equal("Admin Menu");
          done();
        },
        redirect: function (location) {
          location.should.equal("admin");
          done();        
        }
      })
    })
  })
  
  describe('admin_history()', function() {
    it("should provide a title and the admin_history view name", function(done) {
      routes.admin_history({
        session: { is_admin: true },
        param: function() {}
      }, {
        render: function (viewName, params) {
          viewName.should.equal("admin/history");
          params.title.should.equal("Visitor History");
          done();
        },
        redirect: function (location) {
          location.should.equal("admin");
          done();        
        }
      })
    })
  })    
  
  describe('admin_settings()', function() {
    it("should provide a title and the admin_settings view name", function(done) {
      routes.admin_settings({
        session: { is_admin: true }
      }, {
        render: function (viewName, params) {
          viewName.should.equal("admin/settings");
          params.title.should.equal('Lobby App Settings');
          done();
        },
        redirect: function (location) {
          location.should.equal("admin");
          done();        
        }
      })
    })
  })    
  
  describe('admin_reasons()', function() {
    it("should provide a title and the admin_reasons view name", function(done) {
      routes.admin_reasons({
        session: { is_admin: true }
      }, {
        render: function (viewName, params) {
          viewName.should.equal("admin/reasons");
          params.title.should.equal('List of Visit Reasons');
          done();
        },
        redirect: function (location) {
          location.should.equal("admin");
          done();        
        }
      })
    })
  })  
  
  describe('admin_hosts()', function() {
    it("should provide a title and the admin_hosts view name", function(done) {
      routes.admin_hosts({
        session: { is_admin: true },
        param: function() {}
      }, {
        render: function (viewName, params) {
          viewName.should.equal("admin/hosts");
          params.title.should.equal('List of Hosts');
          done();
        },
        redirect: function (location) {
          location.should.equal("admin");
          done();        
        }
      })
    })
  })    
})  

