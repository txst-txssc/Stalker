/*
 * users-test.js Tests the Users controller of the API
 */

var should = require('should'),
    request = require('request'),
    flatiron = require('flatiron'),
    controllers = require('../../lib/controllers'),
    redis = require('redis'),
    events = require('events').EventEmitter,
    pubEvents = require('node-redis-events').Publisher,
    url = require('url'),
    app = flatiron.app;

app.use(flatiron.plugins.http);
var eventEmitter = new events();
var model_events = [
  'user:save',
  'user:update'
];

var redisString = process.env.REDIS_URI || "redis://127.0.0.1:6379",
    redisURI = url.parse(redisString, true);

var pubSubConfig = {
  redis: redis.createClient(parseInt(redisURI.port, 10), redisURI.hostname),
  emitter: eventEmitter,
  namespace: 'stalker'
};
var publisher = new pubEvents(pubSubConfig, model_events);
app.controllers = controllers(eventEmitter);
app.router.path(/users/i, app.controllers.User);
app.start(9090);

beforeEach(function(done) {
  var conn = redis.createClient();
  conn.FLUSHDB(function() {
    done();
  });
});


/*
 * Request Helpers
 */

function makeGetReq(uri, cb) {
  request.get({
    uri: 'http://127.0.0.1:9090' + uri,
    headers: {
      'content-type': 'application/json'
    }
  }, cb);
}

function makePostReq(uri, data, cb) {
  request.post({
    uri: 'http://127.0.0.1:9090' + uri,
    body: JSON.stringify(data),
    headers: {
      'content-type': 'application/json'
    }
  }, cb);
}

function makePutReq(uri, data, cb) {
  request.put({
    uri: 'http://127.0.0.1:9090' + uri,
    body: JSON.stringify(data),
    headers: {
      'content-type': 'application/json'
    }
  }, cb);
}

function makeDeleteReq(uri, cb) {
  request.del({
    uri: 'http://127.0.0.1:9090' + uri,
    headers: {
      'content-type': 'application/json'
    }
  }, cb);
}


describe('Users', function() {

  /*
   * POST /users
   */

  describe('POST /users', function() {
    var result, data;

    // Test Invalid User Object
    describe('invalid user object', function() {

      before(function(done) {
        makePostReq('/users', {}, function(err, res, body) {
          result = res;
          data = JSON.parse(body);
          done();
        });
      });

      it('should return a 400 status code', function() {
        result.statusCode.should.equal(400);
      });

      it('should return an error message', function() {
        should.exist(data.error);
      });
    });

    // Test Valid User Object
    describe('valid user object', function() {

      before(function(done) {
        makePostReq('/users', {name: 'Test User'}, function(err, res, body) {
          result = res;
          data = JSON.parse(body);
          done();
        });
      });

      it('should return a 201 status code', function() {
        result.statusCode.should.equal(201);
      });

      it('should return a user object', function() {
        data.name.should.equal('test user');
        should.exist(data.avatar);
      });
    });

  });


  /*
   * GET /users
   */

  describe('GET /users', function() {
    var result, data;

    before(function(done) {
      // add a user
      makePostReq('/users', {name: 'Test User'}, function(err, res, body) {
        makeGetReq('/users', function(err, res, body) {
          result = res;
          data = JSON.parse(body);
          done();
        });
      });
    });

    it('should return a 200 status code', function() {
      result.statusCode.should.equal(200);
    });

    it('should return an array', function() {
      data.should.be.an.instanceof(Array);
    });
  });


  /*
   * GET /users/:id
   */

  describe('GET /users/:id', function() {
    var result, data;

    // Test valid user
    describe('valid user', function() {

      before(function(done) {
        // add a user to ensure a good ID
        makePostReq('/users', {name: 'Test User'}, function(err, res, body) {
          var id = JSON.parse(body)._id;

          makeGetReq('/users/' + id, function(err, res, body) {
            result = res;
            data = JSON.parse(body);
            done();
          });
        });
      });

      it('should return a 200 status code', function() {
        result.statusCode.should.equal(200);
      });

      it('should return a user object', function() {
        data.name.should.equal('test user');
        should.exist(data.avatar);
      });
    });

    // Test invalid user
    describe('invalid user', function() {

      before(function(done) {
        makeGetReq('/users/200', function(err, res, body) {
          result = res;
          data = JSON.parse(body);
          done();
        });
      });

      it('should return a 404 status code', function() {
        result.statusCode.should.equal(404);
      });

      it('should return an error message', function() {
        should.exist(data.error);
      });
    });
  });

  /*
   * PUT /users/:id
   */

  describe('PUT /users/:id', function() {
    var result, data;

    // Test invalid user object
    describe('invalid user', function() {

      before(function(done) {
        // add a user to ensure a good ID
        makePostReq('/users', {name: 'Test User'}, function(err, res, body) {
          var id = JSON.parse(body)._id;

          makePutReq('/users/' + id, {}, function(err, res, body) {
            result = res;
            data = JSON.parse(body);
            done();
          });
        });
      });

      it('should return a 400 status code', function() {
        result.statusCode.should.equal(400);
      });

      it('should return an error message', function() {
        should.exist(data.error);
      });
    });

    // Test valid User Object
    describe('valid user object', function() {

      before(function(done) {
        // add a user to ensure a good ID
        makePostReq('/users', {name: 'Test User'}, function(err, res, body) {
          var id = JSON.parse(body)._id;

          makePutReq('/users/' + id, {name: 'Johnny Walker', location: 'Office', returning: 'Never' }, function(err, res, obj) {
            result = res;
            data = JSON.parse(obj);
            done();
          });
        });
      });

      it('should return a 200 status code', function() {
        result.statusCode.should.equal(200);
      });

      it('should update user resource', function() {
        data.name.should.equal('johnny walker');
      });

      it('should set location', function() {
        data.location.should.equal('Office');
      });

      it('should set returning', function() {
        data.should.have.property('returning', 'Never');
      });
    });

    // Test updating location
    describe('empty location', function() {

      before(function(done) {
        // add a user to ensure a good ID
        makePostReq('/users', {name: 'Test User'}, function(err, res, body) {
          var id = JSON.parse(body)._id;

          makePutReq('/users/' + id, {location: ''}, function(err, res, body) {
            result = res;
            data = JSON.parse(body);
            done();
          });
        });
      });

      it('should return a 200 status code', function() {
        result.statusCode.should.equal(200);
      });

      it('should clear location', function() {
        data.location.should.equal('');
      });
    });

    // Test updating returning
    describe('empty returning', function() {
      var result, data;

      before(function(done) {
        // add a user to ensure a good ID
        makePostReq('/users', {name: 'Test User', returning: 'Today'}, function(err, res, body) {
          var id = JSON.parse(body)._id;

          makePutReq('/users/' + id, {returning: ''}, function(err, res, body) {
            result = res;
            data = JSON.parse(body);
            done();
          });
        });
      });

      it('should return a 200 status code', function() {
        result.should.have.property('statusCode', 200);
      });

      it('should clear returning', function() {
        data.should.have.property('returning', '');
      });
    });

  });


  /*
   * DELETE /users/:id
   */

  describe('DELETE /users/:id', function() {
    var result, data;

    // Test valid user
    describe('valid user', function() {

      before(function(done) {
        // add a user to ensure a good ID
        makePostReq('/users', {name: 'Test User'}, function(err, res, body) {
          var id = JSON.parse(body)._id;

          makeDeleteReq('/users/' + id, function(err, res) {
            result = res;
            done();
          });
        });
      });

      it('should return a 204 status code', function() {
        result.statusCode.should.equal(204);
      });

    });
  });

});