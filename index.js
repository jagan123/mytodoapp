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
});


// Create a server with a host and port
var server = new Hapi.Server('localhost', 8000);

// Add the route
server.route({
    method: 'GET',
    path: '/tasks',
    handler: function (request, reply) {
      Tasks.find({}, function(err, tasks) {
        if (err) {
          reply({success: false, message: err.message}).code(400);
        }
        else {
          reply({success: true, result: tasks}).code(200);
        }
      });
    },
});

server.route({
  method: 'GET',
  path: '/tasks/{id}',
  handler: function(request, reply) {
    Tasks.findOne({_id: request.params.id}, function(err, task) {
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
});

server.route({
  method: 'POST',
  path: '/tasks',
  config: {
    handler: function(request, reply) {
      var payload = {
        title: request.payload.title,
        status: request.payload.status,
      };
      var newTask = new Tasks(payload);
      newTask.save(function(err, task) {
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
  }
});

server.route({
  method: 'PUT',
  path: '/tasks/{id}',
  config: {
    handler: function(request, reply) {
       var payload = {
        title: request.payload.title,
        status: request.payload.status,
      };
      Tasks.update({_id: request.params.id}, payload, function(err, task) {
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
  }
});

server.route({
  method:'DELETE',
  path: '/tasks/{id}',
  handler: function(request, reply) {
    Tasks.remove({_id: request.params.id}, function(err, task) {
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
});
// Start the server
server.start();

