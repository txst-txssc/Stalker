module.exports = function(emitter) {

  var User = require('../models/user')(emitter);

  return function() {

    /**
     *  Get all Users
     *  GET /users
     *
     *  returns all the users in the system
     */

    this.get(/\/?/, function() {
      var self = this;

      User.all(function(err, users) {
        if(err) {
          return self.res.json(500, { error: err });
        }
        else {
          return self.res.json(200, users);
        }
      });
    });


    /**
     *  Create a new User
     *  POST /users
     *
     *  body - A json object representing a user
     *        :name - string
     *        :avatar - string, optional
     *
     *  returns the new user object
     */

    this.post(/\/?/, function() {
      var self = this,
          data = this.req.body;

      if(data && data.name) {

        // Check if avatar is given, if not assign a cat
        if(!data.avatar) {
          data.avatar = "http://www.9ori.com/en/media/images/718ccfedf6.jpg";
        }

        User.find({name: data.name}, function(err, users) {
          if(err) {
            return self.res.json(500, {error: 'There was errors son!'});
          }

          if(users.length > 0) {
            return self.res.json(201, users[0]);
          }
          else {
            User.create({ name: data.name, avatar: data.avatar }, function(err, user) {
              if(err || !user) {
                return self.res.json(500, { error: 'Unable to create user' });
              }

              return self.res.json(201, user);
            });
          }
        });
      }

      else {
        return self.res.json(400, { error: 'Invalid user object' });
      }
    });


    /**
     *  Get a single user specified by id
     *  GET /users/:id
     *
     *  returns a user object
     */

    this.get(/\/(\d+)\/?/, function (id) {
      var self = this;

      User.get(id, function(err, user) {
        if(err || !user || !user._id) {
          return self.res.json(404, { error: 'User not found' });
        }
        else {
          return self.res.json(200, user);
        }
      });
    });


    /**
     *  Update a User
     *  PUT /users/:id
     *
     *  body - A json object representing user attributes to update.
     *        :name - string, optional
     *        :avatar - string, optional
     *        :location - string, optional
     *        :returning - string, optional
     *
     *  returns the updated user object
     */

    this.put(/\/(\d+)\/?/, function(id) {
      var self = this,
          data = this.req.body;

      var location = typeof data.location !== 'undefined',
          returning = typeof data.returning !== 'undefined';

      if(!data.name && !data.avatar && !location && !returning) {
        return self.res.json(400, { error: 'Invalid entity' });
      }

      // Build an object of attributes to update
      var attributes = {};
      if(data.name) attributes.name = data.name;
      if(data.avatar) attributes.avatar = data.avatar;
      if(returning) attributes.returning = data.returning;
      if(location) attributes.location = data.location;

      User.get(id, function(err, user) {
        user.update(attributes, function(err, obj) {
          if(err) {
            return self.res.json(500, { error: 'Error updating user' });
          }

          return self.res.json(200, obj);
        });
      });
    });


    /**
     *  Delete a User
     *  DELETE /users/:id
     *
     *  returns an `ok` status code
     */

    this.delete(/\/(\d+)\/?/, function(id) {
      var self = this;

      User.destroy(id, function(err) {
        if(err) { return self.res.json(404, { error: 'Error retrieving user' }); }

        return self.res.json(204);
      });
    });

  };
};