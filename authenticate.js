var mongoose = require('mongoose'),
Users = mongoose.model('User'),
boom = require('boom');

module.exports = function (server, options) {
  var scheme = {
    authenticate: function (request, reply) {
      // http://api.domain.com/tasks?authToken=toke-here;
      var token = request.query.authToken;
      if (!token) {
        return reply(boom.unauthorized('Unauthorized'));
      }
      Users.findOne({token: token}, 'email', function (err, user) {
        if (err) {
          return reply(boom.unauthorized('Unauthorized'));
        } else {
          if (!user) {
            return reply(boom.unauthorized('Unauthorized'));
          } else {
            var credentials = {
              id: user._id,
              email: user.email,
            };
            return reply(null, {credentials: credentials});
          }
        }
      });
    }
  };
  return scheme;
};