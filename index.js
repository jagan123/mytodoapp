var Hapi = require('hapi');
var joi = require('joi');
var bcrypt = require('bcrypt');
var randomstring = require('randomstring');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mytodoapp');
mongoose.set('debug', true);

var Tasks = mongoose.model('Task', {
  title: {
    type: String,
  },
  status: {
    type: Boolean,
    default: false,
  },
  _owner: {
    type: String,
    index: true,
    select: false,
  }
});

var Users = mongoose.model('User', {
  name: {
    type: String,
  },
  email: {
    type: String,
    index: true,
    unique: true,
  },
  password: {
    type: String,
    select: false,
  },
  token: {
    type: String,
    index: true,
  },
});

// Create a server with a host and port
var server = new Hapi.Server('localhost', 8000);

var masterScheme = require('./authenticate');
server.auth.scheme('master', masterScheme);
server.auth.strategy('masterAuth', 'master');

// Add the route
server.route({
  method: 'GET',
  path: '/tasks',
  config: {
    handler: function (request, reply) {
      Tasks.find({_owner: request.auth.credentials.id}, function(err, tasks) {
        if (err) {
          reply({success: false, message: err.message}).code(400);
        }
        else {
          reply({success: true, result: tasks}).code(200);
        }
      });
    },
    auth: 'masterAuth'
  },
});

server.route({
  method: 'GET',
  path: '/tasks/{id}',
  config: {
     handler: function (request, reply) {
      Tasks.findOne({_id: request.params.id, _owner: request.auth.credentials.id}, function(err, task) {
        if (err) {
          reply({success:false, message: err.message}).code(400);
        }
        else {
          if (task) {
            reply({succcess: true, result: task}).code(200);
          }
          else {
            reply({success:false, message: 'No task found'}).code(404);
          }
        }
      });
    },
    auth: 'masterAuth',
  }
});

server.route({
  method: 'POST',
  path: '/tasks',
  config: {
    handler: function (request, reply) {
      var payload = {
        title: request.payload.title,
        status: request.payload.status,
        _owner: request.auth.credentials.id,
      };
      var newTask = new Tasks(payload);
      newTask.save (function(err, task) {
        if (err) {
          reply({success: false, message: err.message}).code(400);
        }
        else {
          reply({success: true, result: task}).code(200);
        }
      });
    },
    validate: {
      payload: {
        title: joi.string().required(),
      },
    },
    auth: 'masterAuth',
  }
});

server.route({
  method: 'PUT',
  path: '/tasks/{id}',
  config: {
    handler: function (request, reply) {
       var payload = {
        title: request.payload.title,
        status: request.payload.status,
      };
      Tasks.update({_id: request.params.id, _owner: request.auth.credentials.id}, payload, function(err, task) {
        if (err) {
          reply({success: false, message: err.message}).code(400);
        }
        else {
          if (task) {
            reply({success: true, result: task}).code(200);
          }
          else {
            reply({success: false, message: 'Did not find task to update'}).code(404);
          }
        }
      });
    },
    validate: {
      payload: {
        title: joi.string().required(),
      },
    },
    auth: 'masterAuth',
  }
});

server.route({
  method:'DELETE',
  path: '/tasks/{id}',
  config: {
     handler: function (request, reply) {
      Tasks.remove({_id: request.params.id, _owner: request.auth.credentials.id}, function(err, task) {
        if (err) {
          reply({success:false, message: err.message}).code(400);
        }
        else {
          if (task) {
          reply({success: true, message: 'Deleted'}).code(200);
          }
          else {
            reply({success: false, message: 'No task found to delete'}).code(404);
          }
        }
      });
    },
    auth:'masterAuth',
  }
});

server.route({
  method: 'POST',
  path: '/register',
  config: {
    handler: function (request, reply) {
      Users.findOne({email: request.payload.email}, '_id', function(err, user) {
        if (err) {
          reply({success: false, message: err.message}).code(200);
        }
        else {
          if (user) {
            reply({success: false, message: 'user with that email exists'}).code(400);
          }
          else {
            var payload = {
              email: request.payload.email,
              password: bcrypt.hashSync(request.payload.password, 8),
            };
            var newUser = new Users(payload);
            User.save(function (err, doc) {
              if (err) {
                reply({success: false, message: err.message}).code(400);
              }
              else {
                reply({success: true, message: 'User created succcessfully'}).code(200);
              }
            });
          }
        }
      });
    },
  },
});

server.route({
  method: 'POST',
  path: '/login',
  config: {
    handler: function (request, reply){
      Users.findOne({email: request.payload.email}, '_id', function(err, user) {
        if (err) {
          reply({success: false, message: err.message}).code(200);
        }
        else {
          if (user) {
            var success = bcrypt.compareSync(request.payload.password, doc.password);
            if (success) {
              var token = randomstring.generate(20);
              doc.token = token;
              doc.save(function (err, saved) {
                if (err){
                  reply({success: false, message: err.message}).code(400);
                }
                else {
                  reply({success: true, result: {token: doc.token}}).code(200);
                }
              });
            }
            else {
              reply({success:false, message: 'Please check your password'}).code(400);
            }
          }
          else {
            reply({success:false, message: 'User not found'}).code(404);
          }
        }
      });
    },
  },
});

// Start the server
server.start();

